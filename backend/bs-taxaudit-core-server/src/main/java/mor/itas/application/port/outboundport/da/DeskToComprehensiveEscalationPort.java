package mor.itas.application.port.outboundport.da;

import java.util.List;
import java.util.UUID;

public interface DeskToComprehensiveEscalationPort {
    UUID openComprehensiveCase(EscalationRequest request);

    record EscalationRequest(
        UUID sourceDeskCaseId,
        String tin,
        List<String> carriedEvidence,
        String escalationNarrative,
        String directorActorId
    ) {}
}
