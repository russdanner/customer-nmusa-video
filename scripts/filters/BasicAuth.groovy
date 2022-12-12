import org.apache.commons.lang3.StringUtils
import javax.servlet.http.HttpServletResponse

//response.setHeader("X-Frame-Options", "allow-from https://www.thenmusa.org/");
response.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://thenmusa.org https://*.thenmusa.org");

String correctUsername = "videouser"
String correctPassword = "@#VideoUseR"
boolean doProtect = false

if (doProtect) {
    boolean authorized = false
    String authHeader = request.getHeader("Authorization");
    if (authHeader != null) {
        String[] authHeaderSplit = authHeader.split("\\s");
        for (int i = 0; i < authHeaderSplit.length; i++) {
            String token = authHeaderSplit[i];
            if (token.equalsIgnoreCase("Basic")) {
                String credentials = new String(Base64.getDecoder().decode(authHeaderSplit[i + 1]));
                int index = credentials.indexOf(":");
                if (index != -1) {
                    String username = credentials.substring(0, index).trim();
                    String password = credentials.substring(index + 1).trim();
                    authorized = username.equals(correctUsername) && password.equals(correctPassword);
                }
            }
        }
    }
    if (!authorized) {
        response.setHeader("WWW-Authenticate", "Basic realm=\"Insert credentials\"");
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }
    else {
        filterChain.doFilter(request, response)
    }
} else {
    filterChain.doFilter(request, response)
}