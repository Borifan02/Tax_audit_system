package mor.itas.domain.model.ca;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * FR-04.4-04: Document Request
 * Represents a request for documents sent to the taxpayer during a Comprehensive Audit.
 */
@Getter
@Builder
@ToString
public class CaDocumentRequest {

    private final UUID id;
    private final UUID caseId;
    
    private final String requestDescription;
    private final String requestedDocument;
    
    private final OffsetDateTime dueDate;
    private final String status; // REQUESTED, RECEIVED, OVERDUE, REJECTED
    
    private final String requestingAuditor;
    private final String responseNotes;
    
    private final OffsetDateTime createdAt;

    /**
     * Check if the document request is overdue.
     */
    public boolean isOverdue() {
        if ("RECEIVED".equalsIgnoreCase(status)) {
            return false;
        }
        if (dueDate == null) {
            return false;
        }
        return OffsetDateTime.now().isAfter(dueDate);
    }
    
    /**
     * Determines if the request requires follow-up.
     */
    public boolean requiresFollowUp() {
        return isOverdue() || "REJECTED".equalsIgnoreCase(status);
    }
}
