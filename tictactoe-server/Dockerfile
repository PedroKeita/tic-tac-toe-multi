FROM maven:3.9-eclipse-temurin-8 AS builder

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:8-jre-alpine

WORKDIR /app
COPY --from=builder /app/target/tictactoe-server-1.0-SNAPSHOT.jar app.jar

EXPOSE 8080
ENV JAVA_OPTS="-Xmx256m"

CMD ["java", "-jar", "app.jar"]
