package mor.itas.api.controller.backoffice.jac;

import mor.itas.api.dto.request.ap.jac.AddResearchCommentRequest;
import mor.itas.api.dto.request.ap.jac.AddResearchNoteRequest;
import mor.itas.api.dto.response.ap.jac.ResearchCommentResponse;
import mor.itas.api.dto.response.ap.jac.ResearchNoteResponse;
import mor.itas.application.usecase.ap.AddResearchNoteUseCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Research Workspace Management
 * Endpoints for collaborative research notes, comments, and attachments
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/committee")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('CHAIRPERSON', 'COMMITTEE_CHAIR', 'COMMITTEE_MEMBER') or permitAll()")
public class CommitteeResearchController {

    private final AddResearchNoteUseCase addResearchNoteUseCase;
    private final CommitteeEventService committeeEventService;
    private final mor.itas.engineadapter.dms.MockDmsAdapter dmsAdapter;

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/research-notes
     * Add a research note to a case
     */
    @PostMapping("/cases/{caseId}/research-notes")
    public ResponseEntity<ResearchNoteResponse> addResearchNote(
            @PathVariable UUID caseId,
            @Valid @RequestBody AddResearchNoteRequest request) {
        log.info("Adding research note to caseId={}, category={}", caseId, request.getCategory());
        ResearchNoteResponse note = addResearchNoteUseCase.addNote(caseId, request);
        committeeEventService.broadcastResearchNoteAdded(caseId, note);
        return ResponseEntity.status(HttpStatus.CREATED).body(note);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/cases/{caseId}/research-notes
     * Retrieve paginated research notes for a case
     */
    @GetMapping("/cases/{caseId}/research-notes")
    public ResponseEntity<Page<ResearchNoteResponse>> getResearchNotes(
            @PathVariable UUID caseId,
            Pageable pageable) {
        log.info("Fetching research notes for caseId={}", caseId);
        Page<ResearchNoteResponse> notes = addResearchNoteUseCase.getNotes(caseId, pageable);
        return ResponseEntity.ok(notes);
    }

    /**
     * POST /api/v1/backoffice/ap/committee/research-notes/{noteId}/comments
     * Add a comment to a research note
     */
    @PostMapping("/research-notes/{noteId}/comments")
    public ResponseEntity<ResearchCommentResponse> addComment(
            @PathVariable UUID noteId,
            @Valid @RequestBody AddResearchCommentRequest request) {
        log.info("Adding comment to noteId={}", noteId);
        ResearchCommentResponse comment = addResearchNoteUseCase.addComment(noteId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/research-notes/{noteId}/comments
     * Retrieve paginated comments for a research note
     */
    @GetMapping("/research-notes/{noteId}/comments")
    public ResponseEntity<Page<ResearchCommentResponse>> getComments(
            @PathVariable UUID noteId,
            Pageable pageable) {
        log.info("Fetching comments for noteId={}", noteId);
        Page<ResearchCommentResponse> comments = addResearchNoteUseCase.getComments(noteId, pageable);
        return ResponseEntity.ok(comments);
    }

    /**
     * POST /api/v1/backoffice/ap/committee/research-notes/{noteId}/attachments
     * Upload an attachment to a research note
     */
    @PostMapping("/research-notes/{noteId}/attachments")
    public ResponseEntity<Void> uploadAttachment(
            @PathVariable UUID noteId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String description) {
        log.info("Uploading attachment to noteId={}, fileName={}", noteId, file.getOriginalFilename());
        addResearchNoteUseCase.uploadAttachment(noteId, file, description);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * GET /api/v1/backoffice/ap/committee/attachments/{documentId}
     * Download an attachment by its document ID
     */
    @GetMapping("/attachments/{documentId}")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable UUID documentId) {
        log.info("Downloading attachment documentId={}", documentId);
        try {
            byte[] content = dmsAdapter.downloadDocument(documentId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(content);
        } catch (Exception e) {
            log.error("Failed to download attachment {}: {}", documentId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/v1/backoffice/ap/committee/cases/{caseId}/research-feed
     * Retrieve research feed (all notes and comments) for a case
     */
    @GetMapping("/cases/{caseId}/research-feed")
    public ResponseEntity<Page<ResearchNoteResponse>> getResearchFeed(
            @PathVariable UUID caseId,
            Pageable pageable) {
        log.info("Fetching research feed for caseId={}", caseId);
        Page<ResearchNoteResponse> feed = addResearchNoteUseCase.getResearchFeed(caseId, pageable);
        return ResponseEntity.ok(feed);
    }
}
