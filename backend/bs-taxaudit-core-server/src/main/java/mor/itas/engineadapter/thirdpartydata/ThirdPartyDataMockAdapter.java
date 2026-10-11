package mor.itas.engineadapter.thirdpartydata;

import mor.itas.application.port.outboundport.da.ThirdPartyDataPort;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ThirdPartyDataMockAdapter implements ThirdPartyDataPort {
    @Override
    public List<String> fetchEvidence(String tin, String sourceType) {
        return List.of("MOCK_EVIDENCE_" + sourceType + "_1", "MOCK_EVIDENCE_" + sourceType + "_2");
    }
}
