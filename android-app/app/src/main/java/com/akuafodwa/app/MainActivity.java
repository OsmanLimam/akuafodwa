package com.akuafodwa.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.webkit.MimeTypeMap;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

/**
 * Full-screen wrapper for the AkuafoDwa web app (hash-routed PWA).
 * - No address bar; app opens on the market home.
 * - Photo/document uploads work via the system file picker.
 * - WhatsApp (wa.me), tel:, mailto: and other non-app links open in the phone's own apps.
 * - Pull-to-refresh + offline screen with retry.
 */
public class MainActivity extends Activity {

    private static final int FILE_CHOOSER_CODE = 1001;

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private LinearLayout errorView;
    private ValueCallback<Uri[]> fileUploadCallback;
    private boolean mainFrameFailed = false;
    private View splashView;
    private boolean splashShown = true;
    private final Handler splashHandler = new Handler(Looper.getMainLooper());
    private final Runnable splashTimeoutRunnable = new Runnable() {
        @Override
        public void run() {
            hideSplash();
        }
    };

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        swipeRefresh = findViewById(R.id.swipe_refresh);
        progressBar = findViewById(R.id.progress_bar);
        errorView = findViewById(R.id.error_view);
        Button retryButton = findViewById(R.id.retry_button);
        splashView = findViewById(R.id.splash_view);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Uri uri = Uri.parse(url);
                String scheme = uri.getScheme();
                if (scheme == null) return false;

                if (scheme.equals("http") || scheme.equals("https")) {
                    String host = uri.getHost();
                    String appHost = getString(R.string.app_host);
                    if (host != null && (host.equals(appHost) || host.endsWith("." + appHost))) {
                        return false; // keep AkuafoDwa pages inside the app
                    }
                    // e.g. wa.me share links -> open in WhatsApp / browser
                    return openExternally(uri);
                }
                // tel:, mailto:, sms:, geo:, whatsapp: -> open in the phone's own apps
                return openExternally(uri);
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                mainFrameFailed = false;
                errorView.setVisibility(View.GONE);
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                swipeRefresh.setRefreshing(false);
                progressBar.setVisibility(View.GONE);
                hideSplash();
                super.onPageFinished(view, url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    mainFrameFailed = true;
                    progressBar.setVisibility(View.GONE);
                    swipeRefresh.setRefreshing(false);
                    errorView.setVisibility(View.VISIBLE);
                    hideSplash();
                }
                super.onReceivedError(view, request, error);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100 && !mainFrameFailed) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }

            // Enables <input type="file"> in the web app: listing photos, ID documents, etc.
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = callback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(pickMime(params.getAcceptTypes()));
                try {
                    startActivityForResult(Intent.createChooser(intent, "Choose a file"), FILE_CHOOSER_CODE);
                } catch (Exception e) {
                    fileUploadCallback = null;
                    Toast.makeText(MainActivity.this, "No file picker available", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        swipeRefresh.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
            @Override
            public void onRefresh() {
                webView.reload();
            }
        });

        retryButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                errorView.setVisibility(View.GONE);
                mainFrameFailed = false;
                hideSplash();
                webView.loadUrl(getString(R.string.app_url));
            }
        });

        if (savedInstanceState != null) {
            // Coming back from rotation/process death — no splash needed.
            splashShown = false;
            splashView.setVisibility(View.GONE);
            webView.restoreState(savedInstanceState);
        } else {
            // Safety net: never hold the splash for more than 8 seconds.
            splashHandler.postDelayed(splashTimeoutRunnable, 8000);
            webView.loadUrl(getString(R.string.app_url));
        }
    }

    /** Fades the branded splash out once the market is on screen. */
    private void hideSplash() {
        if (!splashShown) return;
        splashShown = false;
        splashHandler.removeCallbacks(splashTimeoutRunnable);
        splashView.animate()
                .alpha(0f)
                .setDuration(350)
                .withEndAction(new Runnable() {
                    @Override
                    public void run() {
                        splashView.setVisibility(View.GONE);
                    }
                })
                .start();
    }

    private boolean openExternally(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
            return true;
        } catch (Exception e) {
            // No app handles it — just stay inside (or ignore for non-web schemes).
            return uri.getScheme() != null && uri.getScheme().startsWith("http");
        }
    }

    /** Maps <input accept="..."> values to something the Android picker understands. */
    private String pickMime(String[] acceptTypes) {
        if (acceptTypes != null && acceptTypes.length > 0 && acceptTypes[0] != null && !acceptTypes[0].isEmpty()) {
            String first = acceptTypes[0].split(",")[0].trim();
            if (first.contains("/")) return first; // e.g. image/*
            if (first.startsWith(".")) {           // e.g. .pdf
                String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(first.substring(1));
                if (mime != null) return mime;
            }
        }
        return "*/*";
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_CODE) {
            if (fileUploadCallback != null) {
                fileUploadCallback.onReceiveValue(
                        WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                fileUploadCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack() && !mainFrameFailed) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }
}
