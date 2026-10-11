package mor.itas.engineadapter.analytics;

import mor.itas.application.port.outboundport.da.DataAnalyticsPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class DataAnalyticsMockAdapter implements DataAnalyticsPort {
    @Override
    public String runAnalytics(UUID caseId, String tin, List<String> datasets) {
        return "ANALYTICS_RUN_" + UUID.randomUUID().toString();
    }
}
