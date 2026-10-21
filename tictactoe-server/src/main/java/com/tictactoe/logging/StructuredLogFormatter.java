package com.tictactoe.logging;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.logging.ConsoleHandler;
import java.util.logging.Formatter;
import java.util.logging.Handler;
import java.util.logging.LogRecord;
import java.util.logging.Logger;

/**
 * Formatador de logs estruturados em linha unica conforme RNF04.3.
 * Padrao gerado: [TIMESTAMP] [LEVEL] [MODULE] event=... details=...
 */
public class StructuredLogFormatter extends Formatter {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT;

    @Override
    public String format(LogRecord record) {
        String timestamp = ISO_FORMATTER.format(Instant.ofEpochMilli(record.getMillis()));
        String level = record.getLevel().getName();
        String module = extractModuleName(record.getLoggerName());
        String rawMessage = formatMessage(record);

        StringBuilder sb = new StringBuilder();
        sb.append("[").append(timestamp).append("] ")
          .append("[").append(level).append("] ")
          .append("[").append(module).append("] ")
          .append(rawMessage);

        if (record.getThrown() != null) {
            sb.append(" | exception=");
            StringWriter sw = new StringWriter();
            record.getThrown().printStackTrace(new PrintWriter(sw));
            sb.append(sw.toString().replace("\n", " -> ").replace("\r", ""));
        }

        sb.append("\n");
        return sb.toString();
    }

    private String extractModuleName(String loggerName) {
        if (loggerName == null || loggerName.trim().isEmpty()) {
            return "SERVER";
        }
        int lastDot = loggerName.lastIndexOf('.');
        return lastDot >= 0 ? loggerName.substring(lastDot + 1) : loggerName;
    }

    /**
     * Configura o formatador estruturado no root logger do Java Util Logging.
     */
    public static void install() {
        Logger rootLogger = Logger.getLogger("");
        Handler[] handlers = rootLogger.getHandlers();
        boolean hasConsoleHandler = false;

        StructuredLogFormatter formatter = new StructuredLogFormatter();

        for (Handler handler : handlers) {
            handler.setFormatter(formatter);
            if (handler instanceof ConsoleHandler) {
                hasConsoleHandler = true;
            }
        }

        if (!hasConsoleHandler) {
            ConsoleHandler consoleHandler = new ConsoleHandler();
            consoleHandler.setFormatter(formatter);
            rootLogger.addHandler(consoleHandler);
        }
    }
}

