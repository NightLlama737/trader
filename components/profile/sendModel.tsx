"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useRouter } from "next/navigation";

type MyModel = {
  key: string;
  url: string;
  isTrading: boolean;
};

type SendStep = "idle" | "uploading" | "confirming" | "done" | "error";

export default function SendModelPage({ nickname }: { nickname: string }) {
  const recipient = decodeURIComponent(nickname);
  const router = useRouter();

  const [models, setModels] = useState<MyModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<SendStep>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [recipientId, setRecipientId] = useState<string | null>(null);

  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rendererRefs = useRef<Map<string, THREE.WebGLRenderer>>(new Map());
  const [modelLoading, setModelLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/findUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrNick: recipient }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.user) setRecipientId(d.user.id); })
      .catch(console.error);
  }, [recipient]);

  useEffect(() => {
    fetch("/api/getMyModels")
      .then((r) => r.json())
      .then((d) => {
        const list: MyModel[] = d.models || [];
        setModels(list);
        const init: Record<string, boolean> = {};
        list.forEach((m) => { init[m.key] = true; });
        setModelLoading(init);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!models.length) return;
    const loader = new GLTFLoader();
    const renderers: THREE.WebGLRenderer[] = [];

    models.forEach((model) => {
      const container = containerRefs.current.get(model.key);
      if (!container) return;

      const old = rendererRefs.current.get(model.key);
      if (old) { old.dispose(); container.innerHTML = ""; }

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d0d0d);
      const w = container.clientWidth || 200;
      const h = container.clientHeight || 160;
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      container.appendChild(renderer.domElement);
      renderers.push(renderer);
      rendererRefs.current.set(model.key, renderer);

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const dl = new THREE.DirectionalLight(0xffffff, 8);
      dl.position.set(5, 5, 5);
      scene.add(dl);

      fetch(`/api/getSignedUrl?key=${encodeURIComponent(model.key)}`)
        .then((r) => r.json())
        .then(({ url }) => {
          loader.load(url, (gltf) => {
            const obj = gltf.scene;
            scene.add(obj);
            const box = new THREE.Box3().setFromObject(obj);
            obj.position.sub(box.getCenter(new THREE.Vector3()));
            obj.rotation.y = Math.PI * 1.5;
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8;
            camera.position.set(0, 0, cameraZ);
            camera.near = cameraZ / 100;
            camera.far = cameraZ * 100;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
            setModelLoading((prev) => ({ ...prev, [model.key]: false }));
          }, undefined, () => setModelLoading((prev) => ({ ...prev, [model.key]: false })));
        })
        .catch(() => setModelLoading((prev) => ({ ...prev, [model.key]: false })));
    });

    return () => { renderers.forEach((r) => r.dispose()); };
  }, [models]);

  const handleSend = async () => {
    if (!selected || !recipientId) return;
    setStep("uploading");
    setProgress(0);
    setErrorMsg("");

    try {
      // 1. Prepare gift – get sourceUrl + destKey from backend
      const prepRes = await fetch("/api/giftModel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: recipientId,
          modelKey: selected,
          message: message.trim() || undefined,
        }),
      });
      const prepData = await prepRes.json();
      if (!prepRes.ok) throw new Error(prepData.error || "Failed to prepare gift");

      const { giftId, sourceUrl, destKey } = prepData;

      // 2. Fetch the source file from S3 (via signed URL)
      const fileRes = await fetch(sourceUrl);
      if (!fileRes.ok) throw new Error("Failed to download source file");
      const blob = await fileRes.blob();
      const contentType = blob.type || "model/gltf-binary";

      // 3. Get presigned PUT URL for destination key
      const putUrlRes = await fetch("/api/getUploadUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: destKey, contentType }),
      });
      const putUrlData = await putUrlRes.json();
      if (!putUrlRes.ok) throw new Error(putUrlData.error || "Failed to get upload URL");

      // 4. Upload to S3 via XHR (for progress tracking)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.open("PUT", putUrlData.uploadUrl);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.send(blob);
      });

      setStep("confirming");

      // 5. Confirm gift – backend creates Model record in DB
      const confirmRes = await fetch("/api/giftModel/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId, destKey }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error || "Failed to confirm gift");

      setStep("done");
      setTimeout(() => router.back(), 2500);
    } catch (err: unknown) {
      console.error("SEND ERROR:", err);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  };

  // ── Success screen ──
  if (step === "done") {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a0a",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 20,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          border: "1px solid rgba(212,175,55,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.6rem",
          background: "rgba(212,175,55,0.06)",
        }}>
          ✓
        </div>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "1.15rem",
          color: "rgba(245,240,232,0.75)",
          margin: 0,
          letterSpacing: "0.03em",
        }}>
          Gift sent to <span style={{ color: "rgb(212,175,55)" }}>{recipient}</span>
        </p>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "0.78rem",
          color: "rgba(255,255,255,0.2)",
          margin: 0,
          fontStyle: "italic",
        }}>
          Redirecting…
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", paddingTop: 100 }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "0 60px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        marginBottom: 36,
      }}>
        <div>
          <h2 style={{
            margin: 0,
            color: "#f5f0e8",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 400,
            letterSpacing: "0.03em",
          }}>
            Send a Model
          </h2>
          <p style={{
            margin: "6px 0 0",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "0.9rem",
            color: "rgba(245,240,232,0.3)",
          }}>
            to <span style={{ color: "rgb(212,175,55)" }}>{recipient}</span>
          </p>
        </div>

        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 2,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "0.85rem",
            padding: "7px 20px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          ← Back
        </button>
      </div>

      <div style={{ padding: "0 60px 140px" }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.2)",
          marginBottom: 28,
          fontStyle: "italic",
          letterSpacing: "0.04em",
        }}>
          Select a model to gift. The recipient will receive it in their notifications.
        </p>

        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Loading models…
          </p>
        ) : models.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.18)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
            You have no models to send.
          </p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}>
            {models.map((model) => {
              const isSelected = selected === model.key;
              return (
                <div
                  key={model.key}
                  onClick={() => setSelected(isSelected ? null : model.key)}
                  style={{
                    borderRadius: 2,
                    overflow: "hidden",
                    background: "#111",
                    border: isSelected
                      ? "1px solid rgb(212,175,55)"
                      : "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    position: "relative",
                    boxShadow: isSelected ? "0 0 18px rgba(212,175,55,0.12)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: "absolute", top: 8, right: 8, zIndex: 2,
                      background: "rgba(212,175,55,0.15)",
                      border: "1px solid rgba(212,175,55,0.5)",
                      borderRadius: "50%",
                      width: 22, height: 22,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem",
                      color: "rgb(212,175,55)",
                    }}>
                      ✓
                    </div>
                  )}

                  <div
                    ref={(el) => { if (el) containerRefs.current.set(model.key, el); }}
                    style={{ height: 160, background: "#0d0d0d", position: "relative" }}
                  >
                    {modelLoading[model.key] && (
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "rgba(255,255,255,0.15)",
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: "0.72rem",
                        fontStyle: "italic",
                      }}>
                        Loading…
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <p style={{
                      margin: 0,
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: "0.72rem",
                      color: "rgba(255,255,255,0.25)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {model.key.split("/").pop()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom send bar ── */}
      {selected && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(10,10,10,0.96)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
          padding: "18px 60px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          zIndex: 50,
        }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message… (optional)"
            disabled={step !== "idle" && step !== "error"}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 2,
              padding: "9px 14px",
              color: "rgba(245,240,232,0.75)",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.9rem",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
          />

          {/* Progress bar */}
          {step === "uploading" && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 120,
            }}>
              <div style={{
                width: "100%",
                height: 2,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 1,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "rgb(212,175,55)",
                  transition: "width 0.2s ease",
                  borderRadius: 1,
                }} />
              </div>
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "0.7rem",
                color: "rgba(212,175,55,0.7)",
                textAlign: "right",
              }}>
                {progress < 100 ? `${progress}%` : "Saving…"}
              </span>
            </div>
          )}

          {step === "confirming" && (
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.82rem",
              color: "rgba(212,175,55,0.6)",
              fontStyle: "italic",
            }}>
              Saving…
            </span>
          )}

          {step === "error" && (
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.78rem",
              color: "rgba(210,90,90,0.85)",
              maxWidth: 260,
            }}>
              {errorMsg}
            </span>
          )}

          <button
            onClick={handleSend}
            disabled={step === "uploading" || step === "confirming"}
            style={{
              background: "transparent",
              border: `1px solid ${step === "error" ? "rgba(210,90,90,0.4)" : "rgba(212,175,55,0.45)"}`,
              borderRadius: 2,
              color: step === "error" ? "rgba(210,90,90,0.85)" : "rgb(212,175,55)",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.9rem",
              letterSpacing: "0.07em",
              padding: "9px 28px",
              cursor: step === "uploading" || step === "confirming" ? "not-allowed" : "pointer",
              transition: "all 0.22s",
              opacity: step === "uploading" || step === "confirming" ? 0.5 : 1,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (step !== "uploading" && step !== "confirming") {
                e.currentTarget.style.background = step === "error"
                  ? "rgba(210,90,90,0.06)"
                  : "rgba(212,175,55,0.07)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {step === "uploading" ? "Uploading…"
              : step === "confirming" ? "Saving…"
              : step === "error" ? "↺ Retry"
              : `↗ Gift to ${recipient}`}
          </button>
        </div>
      )}
    </div>
  );
}