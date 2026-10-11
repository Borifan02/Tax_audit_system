package mor.itas.api.mapper.ap;

import mor.itas.api.dto.response.ap.jac.AuditorNominationResponse;
import mor.itas.persistence.jpa.entity.ap.AuditorNominationEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper for auditor nomination entities to response DTOs
 */
@Component
public class AuditorNominationJacMapper {
    
    public AuditorNominationResponse toResponse(AuditorNominationEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return AuditorNominationResponse.builder()
            .nominationId(entity.getNominationId())
            .auditorId(entity.getNominatedAuditorId())
            .justification(entity.getJustification())
            .nominatingMemberId(entity.getNominatingMemberId())
            .nominatedAt(entity.getNominatedAt())
            .build();
    }
}
