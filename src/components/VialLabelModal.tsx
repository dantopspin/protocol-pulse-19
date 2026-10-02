import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Camera, ImagePlus } from "lucide-react";
import { Button, Field, Note, Sheet, inputClass, selectClass } from "@/components/kit";
import { COMPOUNDS } from "@/lib/compounds";
import { readVialLabel, type LabelDetails } from "@/lib/vial-label.functions";
import { setState, uid } from "@/lib/store";
import type { AmountUnit, Vial } from "@/lib/types";

const blank: LabelDetails = { compound: "", concentration: "", totalAmount: "", lot: "", expiry: "", supplier: "" };

async function preparePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG, or WebP photo.");
  if (file.size > 15_000_000) throw new Error("Choose a photo smaller than 15 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This photo cannot be opened on this device.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    bitmap.close();
  }
}

export function VialLabelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState("");
  const [details, setDetails] = useState<LabelDetails>(blank);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<"mg" | "mcg">("mg");
  const [date, setDate] = useState("");
  const [diluent, setDiluent] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [hasResult, setHasResult] = useState(false);

  useEffect(() => {
    if (!open) {
      setPhoto(""); setDetails(blank); setAmount(""); setUnit("mg"); setDate("");
      setDiluent(""); setError(""); setReading(false); setHasResult(false);
    }
  }, [open]);

  const change = (key: keyof LabelDetails, value: string) => setDetails((current) => ({ ...current, [key]: value }));

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setHasResult(false); setDetails(blank); setAmount(""); setDate("");
    try {
      setPhoto(await preparePhoto(file));
    } catch (cause) {
      setPhoto("");
      setError(cause instanceof Error ? cause.message : "This photo could not be opened.");
    }
  }

  async function readPhoto() {
    if (!photo || reading) return;
    setReading(true); setError(""); setHasResult(false);
    try {
      const result = await readVialLabel({ data: { image: photo } });
      if (!result.ok) { setError(result.error); return; }
      setDetails(result.details);
      // Only a separately printed total amount may prefill inventory quantity.
      const match = result.details.totalAmount.trim().match(/^(\d+(?:\.\d+)?)\s*(mg|mcg)$/i);
      setAmount(match?.[1] ?? "");
      setUnit(match?.[2]?.toLowerCase() === "mcg" ? "mcg" : "mg");
      const iso = result.details.expiry.trim();
      setDate(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : "");
      setHasResult(true);
    } catch {
      setError("The label could not be read. Please try again.");
    } finally {
      setReading(false);
    }
  }

  function save() {
    const name = details.compound.trim();
    const quantity = Number(amount);
    const volume = diluent.trim() ? Number(diluent) : 0;
    if (!name || !Number.isFinite(quantity) || quantity <= 0 || quantity > 100000 ||
      !Number.isFinite(volume) || volume < 0 || volume > 1000 ||
      (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
      setError("Enter a compound name, a valid total vial amount, and valid optional values before saving.");
      return;
    }
    const known = COMPOUNDS.find((compound) =>
      [compound.name, ...compound.alternate_names].some((candidate) => candidate.toLowerCase() === name.toLowerCase()));
    const id = uid();
    const now = new Date().toISOString();
    const vial: Vial = {
      id,
      compound_id: known?.id ?? `custom:${name}`,
      protocol_ids: [],
      name,
      status: volume > 0 ? "active" : "sealed",
      original_amount: quantity,
      amount_unit: unit as AmountUnit,
      diluent_volume_ml: volume,
      reconstitution_date: volume > 0 ? now : null,
      user_expiry_date: date || null,
      batch_number: details.lot.trim(),
      supplier_or_clinic: details.supplier.trim(),
      label_photo_uri: null,
      storage_notes: details.concentration.trim() ? `Label strength: ${details.concentration.trim()}` : "",
      estimated_remaining_amount: quantity,
      manual_remaining_amount: null,
      created_at: now,
      depleted_at: null,
      archived_at: null,
    };
    setState((state) => ({ ...state, vials: [vial, ...state.vials] }));
    onClose();
    void navigate({ to: "/vials", hash: `rec-${id}` });
  }

  return (
    <Sheet open={open} onClose={onClose} title="Scan vial label">
      <div className="page-x pb-8 pt-5">
        <p className="eyebrow mb-4">Label photo</p>
        <label className="flex min-h-[64px] cursor-pointer items-center justify-center gap-3 border border-dashed border-hairline px-4 text-[14px] text-primary">
          <ImagePlus className="size-5" strokeWidth={1.5} /> {photo ? "Choose another photo" : "Choose or take a photo"}
          <input aria-label="Vial label photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={selectPhoto} className="sr-only" />
        </label>
        {photo && <img src={photo} alt="Selected vial label" className="mt-4 max-h-64 w-full border border-hairline object-contain" />}
        {photo && <Button full className="mt-4" onClick={readPhoto} disabled={reading}>
          <Camera className="size-4" /> {reading ? "Reading label…" : hasResult ? "Read again" : "Read label"}
        </Button>}
        {error && <p role="alert" className="mt-4 text-[13px] text-destructive">{error}</p>}

        {hasResult && (
          <div className="mt-7 border-t border-hairline pt-5">
            <h3 className="text-[18px] font-semibold">Review label details</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">Only visible text is extracted. Correct any mistakes before adding this vial.</p>
            <Field label="Compound name"><input className={inputClass} value={details.compound} onChange={(e) => change("compound", e.target.value)} placeholder="Enter name" /></Field>
            <Field label="Printed concentration or strength"><input className={inputClass} value={details.concentration} onChange={(e) => change("concentration", e.target.value)} placeholder="Not visible" /></Field>
            <Field label="Total amount in vial" hint="Required for inventory. Do not copy a per-mL concentration here.">
              <div className="flex gap-3"><input className={inputClass} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
                <select className={selectClass + " max-w-[96px]"} value={unit} onChange={(e) => setUnit(e.target.value as "mg" | "mcg")} aria-label="Amount unit"><option>mg</option><option>mcg</option></select></div>
            </Field>
            <Field label="Lot or batch"><input className={inputClass} value={details.lot} onChange={(e) => change("lot", e.target.value)} placeholder="Not visible" /></Field>
            <Field label="Expiry as printed"><input className={inputClass} value={details.expiry} onChange={(e) => change("expiry", e.target.value)} placeholder="Not visible" /></Field>
            <Field label="Expiry date for inventory" hint="Enter a complete date if known."><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Supplier or clinic"><input className={inputClass} value={details.supplier} onChange={(e) => change("supplier", e.target.value)} placeholder="Not visible" /></Field>
            <Field label="Diluent added (mL)" hint="Leave empty if the vial is sealed or you do not know."><input className={inputClass} inputMode="decimal" value={diluent} onChange={(e) => setDiluent(e.target.value)} placeholder="Optional" /></Field>
            <Button full className="mt-6" onClick={save}>Add to inventory</Button>
          </div>
        )}
        <div className="mt-6"><Note>AI can misread labels. This does not verify contents, authenticity, concentration, or medical suitability. The photo is sent for reading only and is not saved with the vial.</Note></div>
      </div>
    </Sheet>
  );
}