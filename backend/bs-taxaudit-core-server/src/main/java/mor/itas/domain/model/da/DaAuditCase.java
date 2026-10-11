package mor.itas.domain.model.da;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import mor.itas.domain.valueobject.AuditType;
import mor.itas.domain.valueobject.da.DaAuditPhase;
import mor.itas.domain.valueobject.da.DaAuditStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DaAuditCase {
    private String caseId;
    private String taxpayerId;
    private String taxpayerName;
    private String tin;
    
    @Builder.Default
    private AuditType auditType = AuditType.DESK_AUDIT;
    
    @Builder.Default
    private DaAuditPhase currentPhase = DaAuditPhase.PREPARATION;
    
    @Builder.Default
    private DaAuditStatus currentStatus = DaAuditStatus.AUDITOR_ASSIGNED;
    
    private String assignedTeamId;
    private String leadAuditorId;
    private String teamLeaderId;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;

    public void transitionTo(DaAuditPhase newPhase, DaAuditStatus newStatus) {
        // Enforce business rules here (simplified for now)
        this.currentPhase = newPhase;
        this.currentStatus = newStatus;
        this.updatedAt = LocalDateTime.now();
        if (newStatus == DaAuditStatus.COMPLETED || newStatus == DaAuditStatus.COMPREHENSIVE_ROUTED) {
            this.completedAt = LocalDateTime.now();
        }
    }
}
