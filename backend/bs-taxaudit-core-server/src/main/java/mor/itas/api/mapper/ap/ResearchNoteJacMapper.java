package mor.itas.api.mapper.ap;

import mor.itas.api.dto.response.ap.jac.ResearchCommentResponse;
import mor.itas.api.dto.response.ap.jac.ResearchNoteResponse;
import mor.itas.persistence.jpa.entity.ap.ResearchCommentEntity;
import mor.itas.persistence.jpa.entity.ap.ResearchNoteEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper for research note entities to response DTOs
 */
@Component
public class ResearchNoteJacMapper {
    
    public ResearchNoteResponse toResponse(ResearchNoteEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return ResearchNoteResponse.builder()
            .noteId(entity.getNoteId())
            .authorId(entity.getAuthorId())
            .authorName(entity.getAuthorName())
            .category(entity.getCategory())
            .content(entity.getContent())
            .attachmentCount(entity.getAttachments() != null ? entity.getAttachments().size() : 0)
            .comments(
                entity.getComments() != null
                    ? entity.getComments().stream().map(this::toCommentResponse).toList()
                    : null
            )
            .createdAt(entity.getCreatedAt())
            .lastModifiedAt(entity.getUpdatedAt())
            .build();
    }
    
    public ResearchCommentResponse toCommentResponse(ResearchCommentEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return ResearchCommentResponse.builder()
            .commentId(entity.getCommentId())
            .authorId(entity.getAuthorId())
            .authorName(entity.getAuthorName())
            .content(entity.getContent())
            .repliedToCommentId(entity.getRepliedToComment() != null ? entity.getRepliedToComment().getCommentId() : null)
            .createdAt(entity.getCreatedAt())
            .build();
    }
}
