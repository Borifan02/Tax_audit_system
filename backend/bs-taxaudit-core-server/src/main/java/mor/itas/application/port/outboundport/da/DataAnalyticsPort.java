package mor.itas.application.port.outboundport.da;

import java.util.List;
import java.util.UUID;

public interface DataAnalyticsPort {
    String runAnalytics(UUID caseId, String tin, List<String> datasets);
}
