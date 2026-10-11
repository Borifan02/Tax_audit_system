package mor.itas.domain.service.ap;
import java.util.UUID;
import org.springframework.stereotype.Service;
@Service
public class AuditTrailService {
    public void logAction(UUID caseId, UUID actorId, String action, String entityType, String before, String after, String comments) {}
}
