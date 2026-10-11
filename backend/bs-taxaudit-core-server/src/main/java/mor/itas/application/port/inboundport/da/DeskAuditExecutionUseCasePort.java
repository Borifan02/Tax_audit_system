package mor.itas.application.port.inboundport.da;

import mor.itas.api.dto.request.da.*;
import mor.itas.persistence.jpa.entity.da.*;
import java.util.Map;
import java.util.UUID;

public interface DeskAuditExecutionUseCasePort {
    DaEvidenceEntity addEvidence(UUID caseId, AddEvidenceRequest request, String actorId);
    DaAuditProcedureEntity recordProcedure(UUID caseId, AddProcedureRequest request, String actorId);
    DaDraftReportEntity submitDraftReport(UUID caseId, SubmitDraftReportRequest request, String actorId);
    DaDraftReportEntity reviewDraftReport(UUID caseId, ReviewDraftReportRequest request, String actorId);
    DaFindingEntity createFinding(UUID caseId, CreateFindingRequest request, String actorId);
    DaWorkingPaperEntity createWorkingPaper(UUID caseId, CreateWorkingPaperRequest request, String actorId);
    DaFindingEntity updateFinding(UUID caseId, UUID findingId, UpdateFindingRequest request, String actorId);
    DaWorkingPaperEntity updateWorkingPaper(UUID caseId, UUID wpId, UpdateWorkingPaperRequest request, String actorId);
    DaQueryEntity createQuery(UUID caseId, CreateQueryRequest request, String actorId);
    DaQueryEntity updateQuery(UUID caseId, UUID queryId, UpdateQueryRequest request, String actorId);
    Map<String, Object> autosaveCase(UUID caseId, Map<String, Object> snapshot, String actorId);
    Map<String, Object> getCaseSnapshot(UUID caseId);
    DaAuditProcedureEntity updateProcedure(UUID caseId, UUID procId, UpdateProcedureRequest request, String actorId);
    void deleteEvidence(UUID caseId, UUID evidenceId, String actorId);
    void deleteFinding(UUID caseId, UUID findingId, String actorId);
    void deleteWorkingPaper(UUID caseId, UUID wpId, String actorId);
}
