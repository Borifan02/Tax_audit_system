package mor.itas.api.controller.backoffice.ap;

import lombok.RequiredArgsConstructor;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/backoffice/ap/cases")
@RequiredArgsConstructor
public class ApAuditCaseController {

    private final ApAuditCaseRepository auditCaseRepository;

    @GetMapping
    public ResponseEntity<List<ApAuditCaseEntity>> getCases(
            @RequestParam(required = false) String assignedAuditor,
            @RequestParam(required = false) String assignedTeamLeader,
            @RequestParam(required = false) String status) {
        
        List<ApAuditCaseEntity> cases = auditCaseRepository.findAll();
        
        if (assignedAuditor != null && !assignedAuditor.isEmpty()) {
            cases = cases.stream()
                .filter(c -> assignedAuditor.equals(c.getAssignedAuditorId()))
                .collect(Collectors.toList());
        }
        
        if (assignedTeamLeader != null && !assignedTeamLeader.isEmpty()) {
            cases = cases.stream()
                .filter(c -> assignedTeamLeader.equals(c.getAssignedTeamLeaderId()))
                .collect(Collectors.toList());
        }

        if (status != null && !status.isEmpty()) {
            cases = cases.stream()
                .filter(c -> status.equals(c.getCaWorkflowStatus()) || status.equals(c.getStatus()))
                .collect(Collectors.toList());
        }
        
        return ResponseEntity.ok(cases);
    }

    @PostMapping("/seed")
    public ResponseEntity<String> seedCases() {
        try {
            ApAuditCaseEntity dummyCase = ApAuditCaseEntity.builder()
                .id(UUID.fromString("ca202600-0000-0000-0000-000000000001"))
                .caseNumber("COMP-2026-001")
                .taxpayerId("TP-1001")
                .taxpayerName("Acme Corp CA")
                .tin("123456789")
                .auditType("COMPREHENSIVE")
                .status("IN_PROGRESS")
                .caWorkflowStatus("FIELDWORK")
                .assignedAuditorId("u-aud-federal-lto1-comp-1-1")
                .assignedTeamLeaderId("u-tl-federal-lto1-comp-1")
                .riskScore(85)
                .createdAt(java.time.OffsetDateTime.now())
                .updatedAt(java.time.OffsetDateTime.now())
                .build();
            auditCaseRepository.save(dummyCase);
            return ResponseEntity.ok("Seeded 1 dummy comprehensive case.");
        } catch (Exception e) {
            return ResponseEntity.ok("Case already exists.");
        }
    }

    @PostMapping("/seed-da")
    public ResponseEntity<String> seedDaCase() {
        ApAuditCaseEntity daCase = ApAuditCaseEntity.builder()
            .caseNumber("DESK-2026-001")
            .taxpayerId("TP-2002")
            .taxpayerName("Zemen Bank")
            .tin("987654321")
            .auditType("DESK_AUDIT")
            .status("IN_PROGRESS")
            .caWorkflowStatus("ASSIGNED")
            .assignedAuditorId("u-aud-federal-lto1-desk-1-1") // Desk auditor
            .assignedTeamLeaderId("u-tl-federal-lto1-desk-1") // Desk team leader
            .createdBy("system")
            .planId(UUID.randomUUID())
            .allocationId(UUID.randomUUID())
            .riskScore(75)
            .createdAt(java.time.OffsetDateTime.now())
            .updatedAt(java.time.OffsetDateTime.now())
            .build();
        auditCaseRepository.save(daCase);
        return ResponseEntity.ok("Seeded 1 dummy DESK audit case.");
    }
}
