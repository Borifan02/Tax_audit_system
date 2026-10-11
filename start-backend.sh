#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "/usr/lib/jvm/jdk-21.0.10-oracle-x64" ]; then
    export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/jdk-21.0.10-oracle-x64}"
else
    export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"
fi
export PATH="$JAVA_HOME/bin:$PATH"
export DB_PORT="${DB_PORT:-5432}"

cd "$DIR/backend/bs-taxaudit-core-server"
exec mvn spring-boot:run -P \!allow-http-repos -Dspring-boot.run.profiles=mock -DskipTests

