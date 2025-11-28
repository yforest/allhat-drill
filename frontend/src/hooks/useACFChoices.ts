import { useEffect, useState } from "react";
import apiClient from "../api/client";
import CONFIG from "../config";

type UseACFChoicesResult = {
  choices: string[];
  loading: boolean;
  error: any | null;
};

const FALLBACK_DRILL_TYPES = [
  "シェイクアウト訓練",
  "炊き出し訓練",
  "安否確認訓練",
  "避難誘導訓練",
  "AED・救命講習",
  "その他",
];

export default function useACFChoices(fieldName: string): UseACFChoicesResult {
  const [choices, setChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (!fieldName) return;
    let cancelled = false;

    async function fetchChoices() {
      setLoading(true);
      setError(null);

      try {
        // 1) Try ACF field-groups endpoint
        try {
          const endpoint = (CONFIG && CONFIG.ENDPOINTS && CONFIG.ENDPOINTS.ACF_FIELDS) || "/acf/v3/field-groups";
          const res = await apiClient.get(endpoint);
          const groups = res.data;
          const found = extractChoicesFromGroups(groups, fieldName);
          if (found && found.length > 0) {
            if (!cancelled) setChoices(found);
            return;
          }
        } catch (e) {
          // ignore and try next
        }

        // 2) Try /acf/v3/fields
        try {
          const res = await apiClient.get("/acf/v3/fields");
          const fields = res.data;
          const found = findFieldChoices(fields, fieldName);
          if (found && found.length > 0) {
            if (!cancelled) setChoices(found);
            return;
          }
        } catch (e) {
          // ignore and try next
        }

        // 3) Scan a few recent posts for examples (infer choices)
        try {
          const postsRes = await apiClient.get(`${CONFIG.ENDPOINTS.POSTS}?per_page=5&acf_format=standard`);
          const posts = Array.isArray(postsRes.data) ? postsRes.data : [];
          for (const p of posts) {
            const acf = p && p.acf ? p.acf : null;
            if (acf && typeof acf === "object" && acf[fieldName]) {
              if (Array.isArray(acf[fieldName]) && acf[fieldName].length > 0) {
                if (!cancelled) setChoices(acf[fieldName].map((v: any) => String(v)));
                return;
              }
              // if it's an object mapping keys->labels
              if (typeof acf[fieldName] === "object" && Object.keys(acf[fieldName]).length > 0) {
                if (!cancelled) setChoices(Object.keys(acf[fieldName]).map(k => String(acf[fieldName][k] ?? k)));
                return;
              }
            }
          }
        } catch (e) {
          // ignore
        }

        // 4) Final fallback
        if (!cancelled) setChoices(FALLBACK_DRILL_TYPES);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setChoices(FALLBACK_DRILL_TYPES);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchChoices();
    return () => {
      cancelled = true;
    };
  }, [fieldName]);

  return { choices, loading, error };
}

function extractChoicesFromGroups(groups: any, fieldName: string): string[] | null {
  const arr = Array.isArray(groups) ? groups : (groups && groups.data) ? groups.data : [];
  for (const g of arr) {
    const fields = g.fields || g.acf_fields || g.acf || [];
    for (const f of fields) {
      if (!f) continue;
      const name = f.name || f.key || f.field_name;
      if (name === fieldName) {
        if (f.choices && typeof f.choices === "object") {
          return Object.keys(f.choices).map(k => {
            const v = f.choices[k];
            return typeof v === "string" ? v : String(v);
          });
        }
      }
    }
  }
  return null;
}

function findFieldChoices(fields: any, fieldName: string): string[] | null {
  const arr = Array.isArray(fields) ? fields : (fields && fields.data) ? fields.data : [];
  for (const f of arr) {
    if (!f) continue;
    const name = f.name || f.key;
    if (name === fieldName) {
      if (f.choices && typeof f.choices === "object") {
        return Object.keys(f.choices).map(k => {
          const v = f.choices[k];
          return typeof v === "string" ? v : String(v);
        });
      }
    }
  }
  return null;
}