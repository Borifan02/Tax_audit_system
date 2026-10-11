@echo off
setlocal
set "MAVEN=C:\Program Files\Apache\Maven\apache-maven-3.9.16\bin\mvn.cmd"
"%MAVEN%" spring-boot:run "-Dspring-boot.run.profiles=mock" "-DskipTests"
