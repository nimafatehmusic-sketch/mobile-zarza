
package ir.mobilezarza.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

import com.getcapacitor.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SaveFile")
public class SaveFilePlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String fileName = call.getString("fileName");

        if (fileName == null || fileName.trim().isEmpty()) {
            fileName = "mobile-zarza-backup.json";
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, fileName);

        startActivityForResult(call, intent, "handleSaveResult");
    }

    @ActivityCallback
    private void handleSaveResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() != Activity.RESULT_OK ||
            result.getData() == null) {
            call.reject("ذخیره فایل لغو شد");
            return;
        }

        Uri uri = result.getData().getData();

        if (uri == null) {
            call.reject("مسیر ذخیره فایل دریافت نشد");
            return;
        }

        try {
            String content = call.getString("content");
            if (content == null) content = "";

            try (OutputStream output =
                getContext().getContentResolver().openOutputStream(uri)) {

                if (output == null) {
                    throw new IllegalStateException(
                        "امکان نوشتن فایل وجود ندارد"
                    );
                }

                output.write(content.getBytes(StandardCharsets.UTF_8));
                output.flush();
            }

            JSObject response = new JSObject();
            response.put("uri", uri.toString());
            call.resolve(response);

        } catch (Exception error) {
            call.reject(
                "ذخیره نسخه پشتیبان انجام نشد: " + error.getMessage(),
                error
            );
        }
    }
}
