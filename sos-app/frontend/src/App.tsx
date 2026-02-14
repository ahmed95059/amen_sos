import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { LOGIN, VILLAGES, MY_CASES, CREATE_CASE, PSY_CASES, PSY_UPDATE_STATUS, PSY_UPLOAD_DOC } from "./ops";
import { clearToken, setToken } from "./auth";

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

export default function App() {
  const [email, setEmail] = useState("decl1@sos.tn");
  const [password, setPassword] = useState("password123");
  const [roleView, setRoleView] = useState<"DECLARANT" | "PSY">("DECLARANT");

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

  const villages = villagesData?.villages ?? [];
  const [villageId, setVillageId] = useState<string>("");
  const [isAnon, setIsAnon] = useState(true);
  const [incidentType, setIncidentType] = useState("VIOLENCE");
  const [urgency, setUrgency] = useState("HIGH");
  const [childName, setChildName] = useState("");
  const [abuserName, setAbuserName] = useState("");
  const [description, setDescription] = useState("");
  const [attachFile, setAttachFile] = useState<File | null>(null);

  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 1000, margin: "0 auto" }}>
      <h2>SOS Tunisie – MVP Test (GraphQL)</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setRoleView("DECLARANT")}>Vue Déclarant</button>
        <button onClick={() => setRoleView("PSY")}>Vue Psychologue</button>
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
            comptes seed: decl1@sos.tn / psy1@sos.tn / psy2@sos.tn (password123)
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
                  {["HEALTH","BEHAVIOR","VIOLENCE","SEXUAL_ABUSE","NEGLECT","CONFLICT","OTHER"].map(x => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>

              <label>
                Urgence:
                <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                  {["LOW","MEDIUM","HIGH","CRITICAL"].map(x => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>

              <input value={abuserName} onChange={(e) => setAbuserName(e.target.value)} placeholder="Nom & prénom abuseur" />
              <input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Nom & prénom enfant" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Champ libre..." rows={5} />

              <label>
                Pièce jointe (optionnel):
                <input type="file" onChange={(e) => setAttachFile(e.target.files?.[0] ?? null)} />
              </label>

              <button
                onClick={async () => {
                  if (!villageId) return alert("Choisir un village");
                  const attachments = attachFile
                    ? [{
                        filename: attachFile.name,
                        mimeType: attachFile.type || "application/octet-stream",
                        base64: await fileToBase64(attachFile)
                      }]
                    : [];

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
                        attachments
                      }
                    }
                  });

                  setDescription("");
                  setAttachFile(null);
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
                  <div>Status: <b>{c.status}</b> — Score: {c.score}</div>
                  <div>Enfant: {c.childName || "-"} | Abuseur: {c.abuserName || "-"}</div>
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
                  <div>Status: <b>{c.status}</b></div>
                </div>

                <div style={{ marginTop: 6 }}>Enfant: {c.childName || "-"} | Abuseur: {c.abuserName || "-"}</div>
                <div style={{ marginTop: 6, color: "#555" }}>{c.description || ""}</div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button onClick={() => psyUpdateStatus({ variables: { caseId: c.id, status: "IN_PROGRESS" } })}>
                    Mettre IN_PROGRESS
                  </button>
                  <button onClick={() => psyUpdateStatus({ variables: { caseId: c.id, status: "FALSE_REPORT" } })}>
                    Marquer FALSE_REPORT
                  </button>
                  <button onClick={() => psyUpdateStatus({ variables: { caseId: c.id, status: "CLOSED" } })}>
                    Clôturer
                  </button>
                </div>

                <div style={{ marginTop: 10 }}>
                  <b>Documents</b>
                  <ul>
                    {(c.documents ?? []).map((d: any) => (
                      <li key={d.id}>{d.docType} — {d.filename}</li>
                    ))}
                  </ul>

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
