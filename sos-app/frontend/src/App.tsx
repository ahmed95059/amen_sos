import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  LOGIN,
  VILLAGES,
  MY_CASES,
  CREATE_CASE,
  PSY_CASES,
  PSY_UPDATE_STATUS,
  PSY_UPLOAD_DOC,
  DIR_VILLAGE_CASES,
  SAUVEGARDE_CASES,
  DIR_VILLAGE_VALIDATE_CASE,
  SAUVEGARDE_VALIDATE_CASE,
} from "./ops";
import { clearToken, getToken, setToken } from "./auth";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const res = String(r.result || "");
      const idx = res.indexOf("base64,");
      resolve(idx >= 0 ? res.slice(idx + 7) : res);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function fileHref(downloadUrl: string, forceDownload = false) {
  const gqlUrl = new URL(import.meta.env.VITE_GRAPHQL_URL);
  const url = new URL(downloadUrl, gqlUrl.origin);
  const token = getToken();
  if (token) url.searchParams.set("token", token);
  if (forceDownload) url.searchParams.set("download", "1");
  return url.toString();
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const normalized = /^\d+$/.test(value) ? Number(value) : value;
  const d = new Date(normalized as any);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR");
}

function statusLabel(status?: string) {
  if (status === "PENDING") return "EN ATTENTE";
  if (status === "IN_PROGRESS") return "EN COURS DE TRAITEMENT";
  if (status === "SIGNED") return "SIGNE";
  if (status === "FALSE_REPORT") return "FAUX SIGNALEMENT";
  if (status === "CLOSED") return "CLOTURE";
  return status || "-";
}

function isAudioFile(file: { mimeType?: string; filename?: string }) {
  const mime = file.mimeType || "";
  const name = (file.filename || "").toLowerCase();
  return mime.startsWith("audio/") || name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".webm") || name.endsWith(".ogg") || name.endsWith(".m4a");
}

function isVideoFile(file: { mimeType?: string; filename?: string }) {
  const mime = file.mimeType || "";
  const name = (file.filename || "").toLowerCase();
  if (mime.startsWith("audio/")) return false;
  if (mime.startsWith("video/")) return true;
  return name.endsWith(".mp4") || name.endsWith(".mov") || name.endsWith(".mkv") || name.endsWith(".avi");
}

function mergeUniqueFiles(existing: File[], incoming: File[]) {
  const map = new Map<string, File>();
  for (const f of existing) map.set(`${f.name}|${f.size}|${f.lastModified}`, f);
  for (const f of incoming) map.set(`${f.name}|${f.size}|${f.lastModified}`, f);
  return Array.from(map.values());
}

export default function App() {
  const [email, setEmail] = useState("decl1@sos.tn");
  const [password, setPassword] = useState("password123");
  const [roleView, setRoleView] = useState<"DECLARANT" | "PSY" | "DIR_VILLAGE" | "RESPONSABLE_SAUVEGARDE">("DECLARANT");

  const [login, loginState] = useMutation(LOGIN, {
    onCompleted: (data) => {
      setToken(data.login.token);
      window.location.reload();
    }
  });

  const { data: villagesData } = useQuery(VILLAGES, { fetchPolicy: "cache-and-network" });

  const { data: myCasesData, refetch: refetchMyCases } = useQuery(MY_CASES, { skip: roleView !== "DECLARANT" });
  const [createCase] = useMutation(CREATE_CASE, { onCompleted: () => refetchMyCases() });

  const { data: psyCasesData, refetch: refetchPsyCases } = useQuery(PSY_CASES, { skip: roleView !== "PSY" });
  const [psyUpdateStatus] = useMutation(PSY_UPDATE_STATUS, { onCompleted: () => refetchPsyCases() });
  const [psyUploadDoc] = useMutation(PSY_UPLOAD_DOC, { onCompleted: () => refetchPsyCases() });

  const { data: dirCasesData, error: dirCasesError, refetch: refetchDirCases } = useQuery(DIR_VILLAGE_CASES, {
    skip: roleView !== "DIR_VILLAGE",
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
  });
  const [dirValidateCase] = useMutation(DIR_VILLAGE_VALIDATE_CASE, { onCompleted: () => refetchDirCases() });

  const { data: sauvegardeCasesData, error: sauvegardeCasesError, refetch: refetchSauvegardeCases } = useQuery(SAUVEGARDE_CASES, {
    skip: roleView !== "RESPONSABLE_SAUVEGARDE",
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
  });
  const [sauvegardeValidateCase] = useMutation(SAUVEGARDE_VALIDATE_CASE, { onCompleted: () => refetchSauvegardeCases() });

  const villages = villagesData?.villages ?? [];
  const [villageId, setVillageId] = useState<string>("");
  const [isAnon, setIsAnon] = useState(true);
  const [incidentType, setIncidentType] = useState("VIOLENCE");
  const [urgency, setUrgency] = useState("HIGH");
  const [childName, setChildName] = useState("");
  const [abuserName, setAbuserName] = useState("");
  const [description, setDescription] = useState("");
  const [attachFiles, setAttachFiles] = useState<File[]>([]);

  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 1000, margin: "0 auto" }}>
      <h2>SOS Tunisie – MVP Test (GraphQL)</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setRoleView("DECLARANT")}>Vue Déclarant</button>
        <button onClick={() => setRoleView("PSY")}>Vue Psychologue</button>
        <button onClick={() => setRoleView("DIR_VILLAGE")}>Vue Directeur Village</button>
        <button onClick={() => setRoleView("RESPONSABLE_SAUVEGARDE")}>Vue Responsable Sauvegarde</button>
        <button
          onClick={() => {
            clearToken();
            window.location.reload();
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 16 }}>
        <h3>Login</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
          <button onClick={() => login({ variables: { email, password } })} disabled={loginState.loading}>
            Se connecter
          </button>
          <span style={{ color: "#666" }}>
            comptes seed: decl1@sos.tn / psy1@sos.tn / psy2@sos.tn / dir.tunis@sos.tn / dir.sousse@sos.tn / resp.sauvegarde@sos.tn (password123)
          </span>
        </div>
        {loginState.error && <div style={{ color: "crimson" }}>{String(loginState.error.message)}</div>}
      </div>

      {roleView === "DECLARANT" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <h3>Créer un signalement (Déclarant)</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label>
                Village:
                <select value={villageId} onChange={(e) => setVillageId(e.target.value)}>
                  <option value="">-- choisir --</option>
                  {villages.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Anonyme:
                <input type="checkbox" checked={isAnon} onChange={(e) => setIsAnon(e.target.checked)} />
              </label>

              <label>
                Type:
                <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
                  {["HEALTH", "BEHAVIOR", "VIOLENCE", "SEXUAL_ABUSE", "NEGLECT", "CONFLICT", "OTHER"].map(x => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>

              <label>
                Urgence:
                <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(x => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>

              <input value={abuserName} onChange={(e) => setAbuserName(e.target.value)} placeholder="Nom & prénom abuseur" />
              <input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Nom & prénom enfant" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Champ libre..." rows={5} />

              <label>
                Pièces jointes (images, vidéo, audio, txt...):
                <input
                  type="file"
                  multiple
                  onChange={(e) => setAttachFiles((prev) => mergeUniqueFiles(prev, Array.from(e.target.files ?? [])))}
                />
              </label>

              <AudioRecorder
                onRecorded={(file) => {
                  setAttachFiles((prev) => mergeUniqueFiles(prev, [file]));
                }}
              />

              {attachFiles.length > 0 && (
                <div style={{ color: "#555", fontSize: 13 }}>
                  {attachFiles.length} fichier(s) prêt(s) à envoyer
                </div>
              )}

              <button
                onClick={async () => {
                  if (!villageId) return alert("Choisir un village");

                  const attachments = await Promise.all(
                    attachFiles.map(async (f) => ({
                      filename: f.name,
                      mimeType: f.type || "application/octet-stream",
                      base64: await fileToBase64(f),
                    }))
                  );

                  await createCase({
                    variables: {
                      input: {
                        isAnonymous: isAnon,
                        villageId,
                        incidentType,
                        urgency,
                        abuserName: abuserName || null,
                        childName: childName || null,
                        description: description || null,
                        attachments,
                      }
                    }
                  });

                  setDescription("");
                  setAttachFiles([]);
                }}
              >
                Créer
              </button>
            </div>
          </div>

          <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <h3>Mes signalements</h3>
            <button onClick={() => refetchMyCases()}>Rafraîchir</button>
            <ul>
              {(myCasesData?.myCases ?? []).map((c: any) => (
                <li key={c.id} style={{ marginTop: 10 }}>
                  <div><b>{c.village.name}</b> — {c.incidentType} / {c.urgency}</div>
                  <div>Créé le: <b>{formatDateTime(c.createdAt)}</b></div>
                  <div>Statut: <b>{statusLabel(c.status)}</b> — Score: {c.score}</div>
                  <div>Enfant: {c.childName || "-"} | Abuseur: {c.abuserName || "-"}</div>
                  <FileList title="Pièces jointes" files={c.attachments ?? []} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {roleView === "PSY" && (
        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
          <h3>Dashboard Psychologue (trié par score)</h3>
          <button onClick={() => refetchPsyCases()}>Rafraîchir</button>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {(psyCasesData?.psyAssignedCases ?? []).map((c: any) => (
              <div key={c.id} style={{ border: "1px solid #eee", padding: 10, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div>
                    <b>{c.village.name}</b> — {c.incidentType}/{c.urgency} — Score <b>{c.score}</b>
                  </div>
                  <div>Statut: <b>{statusLabel(c.status)}</b></div>
                </div>
                <div style={{ marginTop: 6 }}>Créé le: <b>{formatDateTime(c.createdAt)}</b></div>

                <div style={{ marginTop: 6 }}>Enfant: {c.childName || "-"} | Abuseur: {c.abuserName || "-"}</div>
                <div style={{ marginTop: 6, color: "#555" }}>{c.description || ""}</div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {c.status !== "SIGNED" && (
                    <button onClick={() => psyUpdateStatus({ variables: { caseId: c.id, status: "IN_PROGRESS" } })}>
                      Mettre EN COURS DE TRAITEMENT
                    </button>
                  )}
                  {c.status !== "SIGNED" && (
                    <button onClick={() => psyUpdateStatus({ variables: { caseId: c.id, status: "FALSE_REPORT" } })}>
                      Marquer FAUX SIGNALEMENT
                    </button>
                  )}
                  {c.status === "SIGNED" && (
                    <button onClick={() => psyUpdateStatus({ variables: { caseId: c.id, status: "CLOSED" } })}>
                      Clôturer signalement signé
                    </button>
                  )}
                </div>

                <div style={{ marginTop: 10 }}>
                  <FileList title="Pièces jointes du déclarant" files={c.attachments ?? []} />
                  <FileList title="Documents psychologue" files={c.documents ?? []} renderPrefix={(d: any) => d.docType ? `${d.docType} — ` : ""} />

                  <UploadDoc
                    onUpload={async (docType, file) => {
                      const base64 = await fileToBase64(file);
                      await psyUploadDoc({
                        variables: {
                          caseId: c.id,
                          docType,
                          file: { filename: file.name, mimeType: file.type || "application/octet-stream", base64 }
                        }
                      });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {roleView === "DIR_VILLAGE" && (
        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
          <h3>Validation Directeur de Village</h3>
          <button onClick={() => refetchDirCases()}>Rafraîchir</button>
          {dirCasesError && <div style={{ color: "crimson", marginTop: 8 }}>{String(dirCasesError.message)}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {(dirCasesData?.dirVillageCases ?? []).length === 0 && (
              <div style={{ color: "#666" }}>Aucun signalement prêt à valider pour votre village.</div>
            )}
            {(dirCasesData?.dirVillageCases ?? []).map((c: any) => (
              <ValidationCaseCard
                key={c.id}
                c={c}
                validateLabel="Valider (Directeur)"
                onValidate={async (signatureFile) => {
                  await dirValidateCase({
                    variables: {
                      caseId: c.id,
                      signatureFile: {
                        filename: signatureFile.name,
                        mimeType: signatureFile.type || "application/octet-stream",
                        base64: await fileToBase64(signatureFile),
                      },
                    },
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {roleView === "RESPONSABLE_SAUVEGARDE" && (
        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
          <h3>Validation Responsable Sauvegarde</h3>
          <button onClick={() => refetchSauvegardeCases()}>Rafraîchir</button>
          {sauvegardeCasesError && <div style={{ color: "crimson", marginTop: 8 }}>{String(sauvegardeCasesError.message)}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {(sauvegardeCasesData?.sauvegardeCases ?? []).length === 0 && (
              <div style={{ color: "#666" }}>Aucun signalement prêt à valider pour le moment.</div>
            )}
            {(sauvegardeCasesData?.sauvegardeCases ?? []).map((c: any) => (
              <ValidationCaseCard
                key={c.id}
                c={c}
                validateLabel="Valider (Sauvegarde)"
                canValidate={!!c.dirVillageValidatedAt}
                blockedValidationMessage="Validation directeur requise avant signature sauvegarde."
                onValidate={async (signatureFile) => {
                  await sauvegardeValidateCase({
                    variables: {
                      caseId: c.id,
                      signatureFile: {
                        filename: signatureFile.name,
                        mimeType: signatureFile.type || "application/octet-stream",
                        base64: await fileToBase64(signatureFile),
                      },
                    },
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ValidationCaseCard(props: {
  c: any;
  validateLabel: string;
  onValidate: (signatureFile: File) => Promise<void>;
  canValidate?: boolean;
  blockedValidationMessage?: string;
}) {
  const { c } = props;
  const [selectedSignatureFile, setSelectedSignatureFile] = useState<File | null>(null);
  const [uploadedSignatureFile, setUploadedSignatureFile] = useState<File | null>(null);
  const canValidate = props.canValidate ?? true;

  return (
    <div style={{ border: "1px solid #eee", padding: 10, borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div>
          <b>{c.village.name}</b> — {c.incidentType}/{c.urgency} — Score <b>{c.score}</b>
        </div>
        <div>Statut: <b>{statusLabel(c.status)}</b></div>
      </div>
      <div style={{ marginTop: 6 }}>Créé le: <b>{formatDateTime(c.createdAt)}</b></div>
      <div style={{ marginTop: 6 }}>Enfant: {c.childName || "-"} | Abuseur: {c.abuserName || "-"}</div>
      <div style={{ marginTop: 6, color: "#555" }}>{c.description || ""}</div>
      <div style={{ marginTop: 6 }}>
        Validation Directeur: {c.dirVillageValidatedAt ? `OK (${formatDateTime(c.dirVillageValidatedAt)})` : "En attente"}
      </div>
      <div style={{ marginTop: 2 }}>
        Validation Sauvegarde: {c.sauvegardeValidatedAt ? `OK (${formatDateTime(c.sauvegardeValidatedAt)})` : "En attente"}
      </div>

      <div style={{ marginTop: 10 }}>
        <FileList title="Pièces jointes du déclarant" files={c.attachments ?? []} />
        <FileList title="Documents psy (fiche/rapport)" files={c.documents ?? []} renderPrefix={(d: any) => d.docType ? `${d.docType} — ` : ""} />
      </div>

      {canValidate ? (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setSelectedSignatureFile(e.target.files?.[0] ?? null)} />
          <button
            onClick={() => {
              if (!selectedSignatureFile) return alert("Choisir un fichier signature");
              setUploadedSignatureFile(selectedSignatureFile);
            }}
          >
            Upload signature
          </button>
          <button
            onClick={async () => {
              if (!uploadedSignatureFile) return alert("Uploader la signature avant validation");
              try {
                await props.onValidate(uploadedSignatureFile);
                setSelectedSignatureFile(null);
                setUploadedSignatureFile(null);
              } catch (e: any) {
                alert(`Validation échouée: ${String(e?.message || e)}`);
              }
            }}
          >
            {props.validateLabel}
          </button>
          {uploadedSignatureFile && (
            <span style={{ color: "#2e7d32" }}>Signature prête: {uploadedSignatureFile.name}</span>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 10, color: "#777" }}>
          {props.blockedValidationMessage || "Validation non disponible pour le moment."}
        </div>
      )}
    </div>
  );
}

function FileList(props: { title: string; files: any[]; renderPrefix?: (f: any) => string }) {
  return (
    <div style={{ marginTop: 8 }}>
      <b>{props.title}</b>
      <ul>
        {props.files.length === 0 && <li>Aucun fichier</li>}
        {props.files.map((f: any) => (
          <li key={f.id}>
            {props.renderPrefix ? props.renderPrefix(f) : ""}
            {f.filename} ({f.mimeType || "application/octet-stream"})
            {" "}
            <a href={fileHref(f.downloadUrl, false)} target="_blank" rel="noreferrer">Voir</a>
            {" | "}
            <a href={fileHref(f.downloadUrl, true)} target="_blank" rel="noreferrer">Télécharger</a>
            {isAudioFile(f) && (
              <div style={{ marginTop: 6 }}>
                <audio controls src={fileHref(f.downloadUrl, false)} />
              </div>
            )}
            {isVideoFile(f) && (
              <div style={{ marginTop: 6 }}>
                <video controls width={280} src={fileHref(f.downloadUrl, false)} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AudioRecorder(props: { onRecorded: (file: File) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={async () => {
          if (isRecording && recorder) {
            recorder.stop();
            setIsRecording(false);
            return;
          }

          if (!navigator.mediaDevices?.getUserMedia) {
            alert("Enregistrement audio non supporté sur ce navigateur");
            return;
          }

          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const chunks: BlobPart[] = [];
            const r = new MediaRecorder(stream);

            r.ondataavailable = (evt) => {
              if (evt.data.size > 0) chunks.push(evt.data);
            };

            r.onstop = () => {
              const mimeType = r.mimeType || "audio/webm";
              const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : mimeType.includes("mp4") ? "m4a" : "webm";
              const file = new File([new Blob(chunks, { type: mimeType })], `recording-${Date.now()}.${ext}`, { type: mimeType });
              props.onRecorded(file);
              stream.getTracks().forEach((t) => t.stop());
              setRecorder(null);
            };

            r.start();
            setRecorder(r);
            setIsRecording(true);
          } catch {
            alert("Impossible d'accéder au micro");
          }
        }}
      >
        {isRecording ? "Arrêter enregistrement" : "Enregistrer audio"}
      </button>
      {isRecording && <span style={{ color: "#b00020" }}>Enregistrement en cours...</span>}
    </div>
  );
}

function UploadDoc(props: { onUpload: (docType: "FICHE_INITIALE" | "RAPPORT_DPE", file: File) => Promise<void> }) {
  const [docType, setDocType] = useState<"FICHE_INITIALE" | "RAPPORT_DPE">("FICHE_INITIALE");
  const [file, setFile] = useState<File | null>(null);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <select value={docType} onChange={(e) => setDocType(e.target.value as any)}>
        <option value="FICHE_INITIALE">FICHE_INITIALE</option>
        <option value="RAPPORT_DPE">RAPPORT_DPE</option>
      </select>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button
        onClick={async () => {
          if (!file) return alert("Choisir un fichier");
          await props.onUpload(docType, file);
          setFile(null);
        }}
      >
        Upload
      </button>
    </div>
  );
}
