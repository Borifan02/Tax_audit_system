package mor.itas.application.usecase.ap;

import mor.itas.api.dto.request.ap.jac.OverrideSLARequest;
import mor.itas.api.dto.response.ap.jac.CommitteeCaseResponse;
import mor.itas.api.mapper.ap.CommitteeCaseJacMapper;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.observability.audit.ActorContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.UUID;

/**
 * Use Case: SLA Override (Chairperson Only)
 * Extends case deadline with mandatory justification
 */
@Component
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SLAOverrideUseCase {

    private final OverrideSLAUseCase overrideSLAUseCase;
    private final CommitteeCaseRepository caseRepository;
    private final CommitteeCaseJacMapper caseMapper;

    /**
     * Execute: Override SLA deadline with justification
     * 
     * @param caseId the case identifier
     * @param request contains extensionBusinessDays, reason
     * @return CommitteeCaseResponse with updated case details
     */
    public CommitteeCaseResponse execute(UUID caseId, OverrideSLARequest request) {
        log.info("Overriding SLA for caseId={}, extension days={}", caseId, request.getExtensionBusinessDays());
        
        UUID chairpersonId;
        try {
            chairpersonId = UUID.fromString(ActorContextHolder.getActorId());
        } catch (Exception e) {
            chairpersonId = UUID.nameUUIDFromBytes("SYSTEM".getBytes());
        }
        
        OverrideSLAUseCase.OverrideSLARequest useCaseRequest = new OverrideSLAUseCase.OverrideSLARequest(
            caseId,
            request.getExtensionBusinessDays(),
            request.getReason(),
            chairpersonId
        );
        
        try {
            overrideSLAUseCase.execute(useCaseRequest);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to override SLA: " + e.getMessage(), e);
        }
        
        CommitteeCaseEntity updatedCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
            
        return caseMapper.toResponse(updatedCase);
    }
}
