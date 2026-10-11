package mor.itas.application.usecase.ap;

import mor.itas.domain.model.ap.AuditCase;
import mor.itas.domain.service.ap.CaseGenerationService;
import mor.itas.application.port.inboundport.ap.CaseManagementPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

/**
 * Case Management Use Case
 * 
 * Implements CaseManagementPort inbound interface.
 * Orchestrates domain services for case generation, assignment, and lifecycle management.
 * 
 * Hexagonal/DDD: Implements inbound port, delegates to domain services via outbound ports
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CaseManagementUseCase implements CaseManagementPort {

    private final CaseGenerationService caseGenerationService;

    // ==================== CASE GENERATION ====================

    public List<AuditCase> generateCasesForPlan(UUID planId, String actorId) {
        return caseGenerationService.generateCasesForPlan(planId, actorId);
    }

    // ==================== CASE QUERIES ====================

    public AuditCase getCaseById(UUID caseId) {
        return caseGenerationService.getCaseById(caseId);
    }

    public List<AuditCase> getCasesForPlan(UUID planId) {
        return caseGenerationService.getCasesForPlan(planId);
    }

    public List<AuditCase> getCasesByStatus(String status) {
        return caseGenerationService.getCasesByStatus(status);
    }

    public List<AuditCase> getCasesForAuditor(String auditorId) {
        return caseGenerationService.getCasesForAuditor(auditorId);
    }

    public List<AuditCase> getCasesForTeamLeader(String teamLeaderId) {
        return caseGenerationService.getCasesForTeamLeader(teamLeaderId);
    }

    // ==================== CASE ASSIGNMENT ====================

    public AuditCase assignCaseToTeamLeader(UUID caseId, String teamLeaderId) {
        return caseGenerationService.assignCaseToTeamLeader(caseId, teamLeaderId);
    }

    public AuditCase assignCaseToAuditor(UUID caseId, String auditorId) {
        return caseGenerationService.assignCaseToAuditor(caseId, auditorId);
    }

    // ==================== CASE STATUS ====================

    public AuditCase updateCaseStatus(UUID caseId, String newStatus) {
        return caseGenerationService.updateCaseStatus(caseId, newStatus);
    }
}
