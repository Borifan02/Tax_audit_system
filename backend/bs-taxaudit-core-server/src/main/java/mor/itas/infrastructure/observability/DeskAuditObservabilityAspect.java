package mor.itas.infrastructure.observability;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Aspect
@Component
public class DeskAuditObservabilityAspect {

    @Around("execution(* mor.itas.application.usecase.da.*.*(..))")
    public Object observeDeskAuditUseCases(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();
        log.info("[Desk Audit Observability] Started execution of {}", methodName);
        Instant start = Instant.now();
        
        try {
            Object result = joinPoint.proceed();
            long duration = Duration.between(start, Instant.now()).toMillis();
            log.info("[Desk Audit Observability] Completed execution of {} successfully in {} ms", methodName, duration);
            return result;
        } catch (Throwable ex) {
            long duration = Duration.between(start, Instant.now()).toMillis();
            log.error("[Desk Audit Observability] Failed execution of {} after {} ms with exception: {}", 
                    methodName, duration, ex.getMessage());
            throw ex;
        }
    }
}
