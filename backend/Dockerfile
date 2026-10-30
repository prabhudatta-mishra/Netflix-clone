# Compile the Spring Boot backend with Java 17, as required by pom.xml.
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

COPY pom.xml ./
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

# Keep the runtime image small and run on the port supplied by Render.
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar
COPY uploads ./uploads
COPY offline-import ./offline-import

EXPOSE 8080
CMD ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
