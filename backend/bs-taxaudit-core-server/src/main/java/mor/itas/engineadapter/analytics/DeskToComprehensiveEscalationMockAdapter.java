package mor.itas.engineadapter.analytics;

import mor.itas.application.port.outboundport.da.DeskToComprehensiveEscalationPort;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class DeskToComprehensiveEscalationMockAdapter implements DeskToComprehensiveEscalationPort {
    @Override
    public UUID openComprehensiveCase(EscalationRequest request) {
        // Mock implementation that simply returns a new random UUID for the new case
        return UUID.randomUUID();
    }
}
