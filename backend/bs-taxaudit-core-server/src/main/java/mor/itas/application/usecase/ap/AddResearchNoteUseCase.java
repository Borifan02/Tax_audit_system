package mor.itas.application.usecase.ap;

import mor.itas.api.dto.request.ap.jac.AddResearchCommentRequest;
import mor.itas.api.dto.request.ap.jac.AddResearchNoteRequest;
import mor.itas.api.dto.response.ap.jac.ResearchCommentResponse;
import mor.itas.api.dto.response.ap.jac.ResearchNoteResponse;
import mor.itas.api.mapper.ap.ResearchNoteJacMapper;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.entity.ap.ResearchAttachmentEntity;
import mor.itas.persistence.jpa.entity.ap.ResearchCommentEntity;
import mor.itas.persistence.jpa.entity.ap.ResearchNoteEntity;
import mor.itas.persistence.jpa.repository.ap.ResearchNoteRepository;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.observability.audit.ActorContextHolder;
import mor.itas.engineadapter.dms.MockDmsAdapter;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Use Case: Add Research Note & Manage Research Workspace
 * Allows committee members to collaborate on case workspace.
 */
@Component
@RequiredArgsConstructor
@Transactional
public class AddResearchNoteUseCase {
    private final ResearchNoteRepository noteRepository;
    private final CommitteeCaseRepository caseRepository;
    private final ResearchNoteJacMapper mapper;
    private final MockDmsAdapter dmsAdapter;
    
    /**
     * Helper to get current actor's UUID or fallback
     */
    private UUID getCurrentActorId() {
        String actorStr = ActorContextHolder.getActorId();
        try {
            return UUID.fromString(actorStr);
        } catch (IllegalArgumentException e) {
            return UUID.nameUUIDFromBytes("SYSTEM".getBytes());
        }
    }

    // ── Author name resolution ──────────────────────────────────────
    // Cache resolved names to avoid repeated lookups
    private static final Map<UUID, String> NAME_CACHE = new ConcurrentHashMap<>();

    // Seed-user name map (matches seed data IDs and common UUIDs)
    private static final Map<String, String> SEED_NAMES = Map.of(
        "u-tl-aa1a", "Henok Belay",
        "u-tl-aa1c", "Melaku Bekele",
        "u-tl-aa2b", "Almaz Worku",
        "u-aud-aa1e", "Samuel Haile",
        "u-com-aa-chair", "Committee Chair",
        "SYSTEM", "System"
    );

    /**
     * Resolve a UUID to a human-readable display name.
     * Checks cache → seed map → falls back to formatted UUID.
     */
    private String resolveAuthorName(UUID authorId) {
        if (authorId == null) return "Unknown";
        return NAME_CACHE.computeIfAbsent(authorId, id -> {
            // Check seed names by converting UUID back to seed string
            for (var entry : SEED_NAMES.entrySet()) {
                if (UUID.nameUUIDFromBytes(entry.getKey().getBytes()).equals(id)) {
                    return entry.getValue();
                }
            }
            // Check if the actor ID string is a seed name directly
            String actorStr = ActorContextHolder.getActorId();
            if (SEED_NAMES.containsKey(actorStr)) {
                return SEED_NAMES.get(actorStr);
            }
            // Fallback: show short UUID
            return "Member " + id.toString().substring(0, 8).toUpperCase();
        });
    }

    /**
     * Legacy execute method for compatibility
     */
    public UUID execute(AddResearchNoteRequestLegacy request) {
        if (request == null || request.getCaseId() == null || request.getContent() == null) {
            throw new IllegalArgumentException("Case ID and content cannot be null");
        }
        
        CommitteeCaseEntity caseEntity = caseRepository.findById(request.getCaseId())
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + request.getCaseId()));
        
        if (request.getContent().length() > 10000) {
            throw new IllegalArgumentException("Note content exceeds 10,000 character limit");
        }
        
        UUID authorId = request.getAuthorId() != null ? request.getAuthorId() : getCurrentActorId();
        ResearchNoteEntity note = ResearchNoteEntity.builder()
            .noteId(UUID.randomUUID())
            .committeeCaseEntity(caseEntity)
            .authorId(authorId)
            .authorName(resolveAuthorName(authorId))
            .category(request.getCategory() != null ? request.getCategory() : "OBSERVATION")
            .content(request.getContent())
            .createdAt(OffsetDateTime.now())
            .build();
        
        ResearchNoteEntity savedNote = noteRepository.save(note);
        return savedNote.getNoteId();
    }

    /**
     * Add research note to a case
     */
    public ResearchNoteResponse addNote(UUID caseId, AddResearchNoteRequest request) {
        if (request == null || request.getContent() == null) {
            throw new IllegalArgumentException("Request content cannot be null");
        }

        CommitteeCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        if (request.getContent().length() > 10000) {
            throw new IllegalArgumentException("Note content exceeds 10,000 character limit");
        }

        UUID authorId = getCurrentActorId();
        ResearchNoteEntity note = ResearchNoteEntity.builder()
            .noteId(UUID.randomUUID())
            .committeeCaseEntity(caseEntity)
            .authorId(authorId)
            .authorName(resolveAuthorName(authorId))
            .category(request.getCategory() != null ? request.getCategory() : "OBSERVATION")
            .content(request.getContent())
            .createdAt(OffsetDateTime.now())
            .build();

        ResearchNoteEntity saved = noteRepository.save(note);
        return mapper.toResponse(saved);
    }

    /**
     * Retrieve research notes for a case
     */
    public Page<ResearchNoteResponse> getNotes(UUID caseId, Pageable pageable) {
        return noteRepository.findByCaseIdOrderByCreatedAtDesc(caseId, pageable)
            .map(mapper::toResponse);
    }

    /**
     * Add a comment to a research note
     */
    public ResearchCommentResponse addComment(UUID noteId, AddResearchCommentRequest request) {
        if (request == null || request.getContent() == null) {
            throw new IllegalArgumentException("Comment content cannot be null");
        }

        ResearchNoteEntity note = noteRepository.findById(noteId)
            .orElseThrow(() -> new IllegalArgumentException("Research note not found: " + noteId));

        ResearchCommentEntity repliedTo = null;
        if (request.getRepliedToCommentId() != null) {
            repliedTo = note.getComments().stream()
                .filter(c -> c.getCommentId().equals(request.getRepliedToCommentId()))
                .findFirst()
                .orElse(null);
        }

        UUID commentAuthorId = getCurrentActorId();
        ResearchCommentEntity comment = ResearchCommentEntity.builder()
            .commentId(UUID.randomUUID())
            .noteEntity(note)
            .authorId(commentAuthorId)
            .authorName(resolveAuthorName(commentAuthorId))
            .content(request.getContent())
            .repliedToComment(repliedTo)
            .createdAt(OffsetDateTime.now())
            .build();

        note.getComments().add(comment);
        ResearchNoteEntity saved = noteRepository.save(note);

        ResearchCommentEntity savedComment = saved.getComments().stream()
            .filter(c -> c.getCommentId().equals(comment.getCommentId()))
            .findFirst()
            .orElse(comment);

        return mapper.toCommentResponse(savedComment);
    }

    /**
     * Retrieve comments for a research note
     */
    public Page<ResearchCommentResponse> getComments(UUID noteId, Pageable pageable) {
        ResearchNoteEntity note = noteRepository.findById(noteId)
            .orElseThrow(() -> new IllegalArgumentException("Research note not found: " + noteId));

        List<ResearchCommentResponse> commentResponses = note.getComments().stream()
            .map(mapper::toCommentResponse)
            .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), commentResponses.size());

        List<ResearchCommentResponse> subList = (start <= commentResponses.size()) ?
            commentResponses.subList(start, end) : Collections.emptyList();

        return new PageImpl<>(subList, pageable, commentResponses.size());
    }

    /**
     * Upload an attachment to a research note
     */
    public void uploadAttachment(UUID noteId, MultipartFile file, String description) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        ResearchNoteEntity note = noteRepository.findById(noteId)
            .orElseThrow(() -> new IllegalArgumentException("Research note not found: " + noteId));

        // Enforce 25MB limit
        long maxBytes = 25L * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("File size exceeds 25MB limit");
        }

        // Virus scanning (mock)
        try {
            byte[] bytes = file.getBytes();
            String contentStr = new String(bytes);
            if (contentStr.contains("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) {
                throw new IllegalArgumentException("Infected file detected");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to scan file for viruses");
        }

        // Store file via DMS adapter
        UUID documentId;
        try {
            byte[] fileBytes = file.getBytes();
            documentId = dmsAdapter.uploadDocument(file.getOriginalFilename(), fileBytes);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store document: " + file.getOriginalFilename(), e);
        }

        ResearchAttachmentEntity attachment = ResearchAttachmentEntity.builder()
            .attachmentId(documentId)
            .noteEntity(note)
            .fileName(file.getOriginalFilename())
            .filePath("/api/v1/backoffice/ap/committee/attachments/" + documentId)
            .fileSize(file.getSize())
            .fileType(file.getContentType())
            .uploadedBy(getCurrentActorId())
            .uploadedAt(OffsetDateTime.now())
            .build();

        note.getAttachments().add(attachment);
        noteRepository.save(note);
    }

    /**
     * Get research feed (all notes) for a case
     */
    public Page<ResearchNoteResponse> getResearchFeed(UUID caseId, Pageable pageable) {
        return getNotes(caseId, pageable);
    }
    
    @Data
    public static class AddResearchNoteRequestLegacy {
        private UUID caseId;
        private String category;
        private String content;
        private UUID authorId;
        
        public AddResearchNoteRequestLegacy() {}
        
        public AddResearchNoteRequestLegacy(UUID caseId, String category, String content, UUID authorId) {
            this.caseId = caseId;
            this.category = category;
            this.content = content;
            this.authorId = authorId;
        }
    }
}
