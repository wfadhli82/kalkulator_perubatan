import { Clipboard, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AidType, Category, DeliveryFee, DiaperTender, DiaperType, MilkTender, ParliamentZone } from "./data/types";
import {
  buildDiaperApprovalText,
  buildMilkApprovalText,
  calculateDiaperDailyAid,
  calculateMilkDailyAid,
  getDeliveryFee,
  getZoneFromParliament
} from "./lib/calculator";
import { formatCurrencyMYR, productLabel, unique } from "./lib/formatters";
import { parsePositiveInteger } from "./lib/validations";

interface MasterData {
  parliamentZones: ParliamentZone[];
  milkTender: MilkTender[];
  diaperTender: DiaperTender[];
  deliveryFees: DeliveryFee[];
}

const emptyData: MasterData = {
  parliamentZones: [],
  milkTender: [],
  diaperTender: [],
  deliveryFees: []
};

const categories: Category[] = ["Dewasa", "Kanak-kanak"];
const diaperTypes: DiaperType[] = ["Tape", "Pants"];

function App() {
  const [data, setData] = useState<MasterData>(emptyData);
  const [loadError, setLoadError] = useState("");
  const [parliament, setParliament] = useState("");
  const [aidType, setAidType] = useState<AidType>("Susu");
  const [category, setCategory] = useState<Category>("Dewasa");
  const [milkProductId, setMilkProductId] = useState("");
  const [diaperType, setDiaperType] = useState<DiaperType>("Tape");
  const [diaperProductName, setDiaperProductName] = useState("");
  const [diaperSize, setDiaperSize] = useState("");
  const [quantity, setQuantity] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("./data/parliament-zones.json").then((response) => response.json()),
      fetch("./data/tender-susu.json").then((response) => response.json()),
      fetch("./data/tender-lampin.json").then((response) => response.json()),
      fetch("./data/delivery-fees.json").then((response) => response.json())
    ])
      .then(([parliamentZones, milkTender, diaperTender, deliveryFees]) => {
        setData({ parliamentZones, milkTender, diaperTender, deliveryFees });
      })
      .catch(() => setLoadError("Data tender gagal dibaca. Sila semak fail JSON master."));
  }, []);

  const zone = getZoneFromParliament(parliament, data.parliamentZones);
  const dailyQuantity = parsePositiveInteger(quantity);

  const milkProducts = useMemo(
    () => data.milkTender.filter((item) => item.active && item.zone === zone && item.category === category),
    [category, data.milkTender, zone]
  );

  const selectedMilk = milkProducts.find((item) => item.id === milkProductId) ?? null;

  const diaperProducts = useMemo(
    () =>
      data.diaperTender.filter(
        (item) => item.active && item.zone === zone && item.category === category && item.diaperType === diaperType
      ),
    [category, data.diaperTender, diaperType, zone]
  );

  const diaperProductNames = unique(diaperProducts.map((item) => item.productName));
  const diaperSizes = unique(diaperProducts.filter((item) => item.productName === diaperProductName).map((item) => item.size));
  const selectedDiaper =
    diaperProducts.find((item) => item.productName === diaperProductName && item.size === diaperSize) ?? null;

  const selectedSupplier = aidType === "Susu" ? selectedMilk?.supplier : selectedDiaper?.supplier;
  const deliveryFee =
    zone && selectedSupplier ? getDeliveryFee(aidType, zone, selectedSupplier, data.deliveryFees) : null;

  const milkResult =
    aidType === "Susu" && selectedMilk && dailyQuantity && deliveryFee !== null
      ? calculateMilkDailyAid(dailyQuantity, selectedMilk.unitPrice, deliveryFee)
      : null;

  const diaperResult =
    aidType === "Lampin" && selectedDiaper && dailyQuantity && deliveryFee !== null
      ? calculateDiaperDailyAid(dailyQuantity, selectedDiaper.pcsPerPack, selectedDiaper.packPrice, deliveryFee)
      : null;

  const approvalText =
    aidType === "Susu" && selectedMilk && dailyQuantity && deliveryFee !== null
      ? buildMilkApprovalText(zone, selectedMilk, dailyQuantity, deliveryFee)
      : aidType === "Lampin" && selectedDiaper && dailyQuantity && deliveryFee !== null
        ? buildDiaperApprovalText(zone, selectedDiaper, dailyQuantity, deliveryFee)
        : "";

  const resetDynamicFields = () => {
    setMilkProductId("");
    setDiaperProductName("");
    setDiaperSize("");
    setQuantity("");
    setCopied("");
  };

  const resetAll = () => {
    setParliament("");
    setAidType("Susu");
    setCategory("Dewasa");
    setDiaperType("Tape");
    resetDynamicFields();
  };

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1800);
  };

  const summaryText = approvalText
    ? [
        `Parlimen: ${parliament}`,
        `Zon: ${zone}`,
        `Jenis bantuan: ${aidType}`,
        `Pembekal: ${selectedSupplier}`,
        `Jumlah bantuan: ${formatCurrencyMYR((milkResult ?? diaperResult)!.totalAid)}`,
        "",
        approvalText
      ].join("\n")
    : "";

  const missingTenderMessage =
    zone && aidType === "Susu" && category && milkProducts.length === 0
      ? "Tiada rekod tender aktif untuk pilihan ini. Sila semak zon, produk atau hubungi pentadbir."
      : zone && aidType === "Lampin" && category && diaperProducts.length === 0
        ? "Tiada rekod tender aktif untuk pilihan ini. Sila semak zon, produk atau hubungi pentadbir."
        : "";

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">MAIWP</p>
        <h1>Kalkulator Bantuan Perubatan</h1>
        <p>Susu & Lampin Tender</p>
      </section>

      {loadError ? <div className="alert">{loadError}</div> : null}

      <section className="panel form-panel">
        <label>
          <span>Parlimen</span>
          <select
            value={parliament}
            onChange={(event) => {
              setParliament(event.target.value);
              resetDynamicFields();
            }}
          >
            <option value="">Pilih Parlimen</option>
            {data.parliamentZones.map((item) => (
              <option key={item.parliament} value={item.parliament}>
                {item.parliament}
              </option>
            ))}
          </select>
        </label>

        <div className="zone-row">
          <span>Zon Tender</span>
          <strong>{zone || "-"}</strong>
        </div>

        <div>
          <span className="field-title">Jenis Bantuan</span>
          <div className="segmented">
            {(["Susu", "Lampin"] as AidType[]).map((type) => (
              <button
                key={type}
                className={aidType === type ? "active" : ""}
                type="button"
                onClick={() => {
                  setAidType(type);
                  resetDynamicFields();
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <label>
          <span>Kategori Penerima</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as Category);
              resetDynamicFields();
            }}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {aidType === "Susu" ? (
          <label>
            <span>Produk Susu</span>
            <select value={milkProductId} onChange={(event) => setMilkProductId(event.target.value)} disabled={!zone}>
              <option value="">Pilih produk</option>
              {milkProducts.map((item) => (
                <option key={item.id} value={item.id}>
                  {productLabel(item.productName, item.specification)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <div>
              <span className="field-title">Jenis Lampin</span>
              <div className="segmented">
                {diaperTypes.map((type) => (
                  <button
                    key={type}
                    className={diaperType === type ? "active" : ""}
                    type="button"
                    onClick={() => {
                      setDiaperType(type);
                      setDiaperProductName("");
                      setDiaperSize("");
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <label>
              <span>Produk / Jenama</span>
              <select
                value={diaperProductName}
                onChange={(event) => {
                  setDiaperProductName(event.target.value);
                  setDiaperSize("");
                }}
                disabled={!zone}
              >
                <option value="">Pilih produk</option>
                {diaperProductNames.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Saiz</span>
              <select value={diaperSize} onChange={(event) => setDiaperSize(event.target.value)} disabled={!diaperProductName}>
                <option value="">Pilih saiz</option>
                {diaperSizes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <label>
          <span>{aidType === "Susu" ? "Kuantiti Sehari" : "Keping Sehari"}</span>
          <input
            inputMode="numeric"
            min="1"
            pattern="[0-9]*"
            placeholder={aidType === "Susu" ? "Contoh: 1" : "Contoh: 5"}
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>

        {quantity && !dailyQuantity ? <div className="alert">Masukkan nombor bulat positif sahaja.</div> : null}
        {missingTenderMessage ? <div className="alert">{missingTenderMessage}</div> : null}
        {selectedSupplier && deliveryFee === null ? (
          <div className="alert">Kos penghantaran belum dikonfigurasi. Pengiraan tidak boleh diteruskan.</div>
        ) : null}
      </section>

      <ResultSection
        aidType={aidType}
        deliveryFee={deliveryFee}
        diaperResult={diaperResult}
        milkResult={milkResult}
        quantity={dailyQuantity}
        selectedDiaper={selectedDiaper}
        selectedMilk={selectedMilk}
        zone={zone}
      />

      <section className="panel copy-panel">
        <label>
          <span>Ayat Perakuan</span>
          <textarea readOnly value={approvalText} placeholder="Ayat akan dipaparkan selepas semua medan lengkap." />
        </label>
        <div className="actions">
          <button className="primary" type="button" disabled={!approvalText} onClick={() => copyText(approvalText, "Ayat telah disalin")}>
            <Clipboard size={18} />
            Salin Ayat
          </button>
          <button type="button" disabled={!summaryText} onClick={() => copyText(summaryText, "Ringkasan telah disalin")}>
            <Clipboard size={18} />
            Salin Ringkasan
          </button>
          <button type="button" onClick={resetAll}>
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
        {copied ? <div className="toast">{copied}</div> : null}
      </section>
    </main>
  );
}

function ResultSection({
  aidType,
  deliveryFee,
  diaperResult,
  milkResult,
  quantity,
  selectedDiaper,
  selectedMilk,
  zone
}: {
  aidType: AidType;
  deliveryFee: number | null;
  diaperResult: ReturnType<typeof calculateDiaperDailyAid> | null;
  milkResult: ReturnType<typeof calculateMilkDailyAid> | null;
  quantity: number | null;
  selectedDiaper: DiaperTender | null;
  selectedMilk: MilkTender | null;
  zone: string;
}) {
  const result = milkResult ?? diaperResult;
  const supplier = aidType === "Susu" ? selectedMilk?.supplier : selectedDiaper?.supplier;

  return (
    <section className="panel result-panel">
      <div className="result-head">
        <div>
          <span>Jumlah Bantuan Disyorkan</span>
          <strong>{result ? formatCurrencyMYR(result.totalAid) : "RM0.00"}</strong>
        </div>
      </div>

      <div className="detail-grid">
        <Detail label="Zon Tender" value={zone || "-"} />
        <Detail label="Pembekal" value={supplier || "-"} />
        <Detail
          label="Produk Dipilih"
          value={
            selectedMilk
              ? productLabel(selectedMilk.productName, selectedMilk.specification)
              : selectedDiaper
                ? `${selectedDiaper.productName} ${selectedDiaper.size}`
                : "-"
          }
        />
        <Detail
          label={aidType === "Susu" ? "Harga Seunit" : "Harga Satu Pek"}
          value={
            selectedMilk
              ? formatCurrencyMYR(selectedMilk.unitPrice)
              : selectedDiaper
                ? formatCurrencyMYR(selectedDiaper.packPrice)
                : "-"
          }
        />
        {selectedDiaper ? <Detail label="Kandungan Satu Pek" value={`${selectedDiaper.pcsPerPack} keping`} /> : null}
        <Detail label="Keperluan Sehari" value={quantity ? `${quantity} ${aidType === "Susu" ? selectedMilk?.unit ?? "unit" : "keping"}` : "-"} />
        <Detail
          label={aidType === "Susu" ? "Jumlah Unit 30 Hari" : "Jumlah Pek 30 Hari"}
          value={milkResult ? `${milkResult.totalUnits} ${selectedMilk?.unit ?? "unit"}` : diaperResult ? `${diaperResult.totalPacks} pek` : "-"}
        />
        <Detail label="Nilai Item" value={result ? formatCurrencyMYR(result.itemValue) : "-"} />
        <Detail label="Kos Penghantaran" value={deliveryFee !== null ? formatCurrencyMYR(deliveryFee) : "-"} />
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
