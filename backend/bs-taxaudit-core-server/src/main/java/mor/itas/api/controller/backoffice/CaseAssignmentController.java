package mor.itas.api.controller.backoffice;

import lombok.RequiredArgsConstructor;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/backoffice/cases")
@RequiredArgsConstructor
public class CaseAssignmentController {

    private final ApAuditCaseRepository auditCaseRepository;

    @PostMapping("/{caseId}/assign-auditor")
    public ResponseEntity<?> assignAuditorToCase(
            @PathVariable UUID caseId,
            @RequestBody Map<String, String> request) {
        
        Optional<ApAuditCaseEntity> optCase = auditCaseRepository.findById(caseId);
        if (optCase.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        ApAuditCaseEntity caseEntity = optCase.get();
        String auditorId = request.get("auditorId");
        
        // Persist to DB
        caseEntity.setAssignedAuditorId(auditorId);
        caseEntity.setCaWorkflowStatus("AUDITOR_ASSIGNED"); // Update status
        caseEntity.setStatus("AUDITOR_ASSIGNED");
        
        auditCaseRepository.save(caseEntity);
        
        return ResponseEntity.ok(Map.of(
            "assignmentId", UUID.randomUUID().toString(),
            "caseId", caseId.toString(),
            "auditorId", auditorId,
            "status", "AUDITOR_ASSIGNED"
        ));
    }
}
