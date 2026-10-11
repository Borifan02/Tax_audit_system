package mor.itas.application.port.outboundport.da;

import java.util.List;

public interface ThirdPartyDataPort {
    List<String> fetchEvidence(String tin, String sourceType);
}
