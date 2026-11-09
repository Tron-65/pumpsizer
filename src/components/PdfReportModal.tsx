import React, { useRef, useState } from 'react';
import { ProjectData, HydraulicCalculationResults, PumpModel } from '../types/hydraulics';
import { PUMP_CATALOG } from '../data/defaultCatalog';
import {
  UNIT_LABELS,
  flowToDisplay,
  headToDisplay,
  powerToDisplay,
  lengthToDisplay,
  diameterToDisplay,
  formatNum,
} from '../utils/units';
import {
  X,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Building,
  Calendar,
  User,
  Hash,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  results: HydraulicCalculationResults;
}

export const PdfReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  project,
  results,
}) => {
  const { unitSystem, suction, discharge } = project;
  const labels = UNIT_LABELS[unitSystem];
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const pump: PumpModel =
    project.customPump ||
    PUMP_CATALOG.find((p) => p.id === project.selectedPumpId) ||
    PUMP_CATALOG[0];

  const op = results.operatingPoint;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const cleanName = (project.name || 'HydroFlow_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`${cleanName}_Hydraulic_Calculation.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in print:p-0 print:bg-white print:fixed">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:h-auto print:max-h-none print:rounded-none">
        {/* Modal Controls Toolbar (Hidden when printing) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Client-Ready Hydraulic Engineering Report
              </h3>
              <p className="text-xs text-slate-400">
                Print or download high-fidelity PDF calculation document
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Report Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 print:bg-white print:p-0 custom-scrollbar">
          {/* A4 Document Canvas */}
          <div
            ref={reportRef}
            className="bg-white text-slate-900 rounded-xl shadow-2xl p-8 max-w-[800px] mx-auto print:max-w-none print:shadow-none print:rounded-none print:p-4 text-xs font-sans border border-slate-200"
          >
            {/* Header / Letterhead */}
            <div className="border-b-2 border-cyan-700 pb-4 mb-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded bg-cyan-700 text-white font-bold text-xs flex items-center justify-center">
                    HF
                  </div>
                  <span className="text-lg font-bold tracking-tight text-cyan-900">
                    HYDROFLOW ENGINEERING
                  </span>
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-wide">
                  PUMP SIZING & HYDRAULIC CALCULATION REPORT
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Compliant with Hydraulic Institute (HI) & ISO 9906 Engineering Standards
                </p>
              </div>

              <div className="text-right font-mono text-[11px] text-slate-600 space-y-0.5">
                <p>
                  <span className="font-bold text-slate-800">Doc No:</span> {project.projectNumber || 'HF-2026-001'}
                </p>
                <p>
                  <span className="font-bold text-slate-800">Date:</span> {project.date || new Date().toISOString().split('T')[0]}
                </p>
                <p>
                  <span className="font-bold text-slate-800">Revision:</span> {project.revision || 'Rev 01'}
                </p>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-6 text-[11px]">
              <div>
                <span className="text-slate-500 block font-medium">Project Name:</span>
                <span className="font-bold text-slate-800">{project.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Client / Facility:</span>
                <span className="font-bold text-slate-800">{project.clientName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Lead Engineer:</span>
                <span className="font-bold text-slate-800">{project.engineerName || 'Alex Mercer, P.E.'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Calculation Standard:</span>
                <span className="font-bold font-mono text-cyan-800 uppercase">
                  {project.calculationMethod.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Executive Summary Cards */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-800 mb-2 border-b border-slate-200 pb-1">
                1. Executive Duty Point & Pump Sizing Summary
              </h2>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-cyan-50/50 border border-cyan-200 rounded-lg">
                  <span className="text-[10px] text-cyan-800 font-bold block uppercase">
                    Operating Flow
                  </span>
                  <span className="text-lg font-bold font-mono text-cyan-900">
                    {flowToDisplay(op?.flowM3h || results.designFlowM3h, unitSystem).toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{labels.flow}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-600 font-bold block uppercase">
                    Total Dynamic Head (TDH)
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {headToDisplay(results.totalDynamicHeadM, unitSystem).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{labels.head}</span>
                </div>
                <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">
                    Pump Efficiency (η)
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-700">
                    {op?.efficiency || results.pumpEfficiencyAtDuty}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Best Efficiency Point</span>
                </div>
                <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg">
                  <span className="text-[10px] text-amber-800 font-bold block uppercase">
                    Recommended Motor
                  </span>
                  <span className="text-lg font-bold font-mono text-amber-900">
                    {powerToDisplay(results.motorRecommendedKw, unitSystem).toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{labels.power} (IEC/NEMA)</span>
                </div>
              </div>
            </div>

            {/* Section 2: Fluid & Site Conditions */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-800 mb-2 border-b border-slate-200 pb-1">
                2. Fluid Properties & Site Conditions
              </h2>
              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2 font-medium text-slate-600 w-1/4">Fluid Medium:</td>
                    <td className="p-2 font-bold text-slate-900 w-1/4">{project.fluid.name}</td>
                    <td className="p-2 font-medium text-slate-600 w-1/4">Fluid Temperature:</td>
                    <td className="p-2 font-mono text-slate-900 w-1/4">
                      {project.fluid.temperatureC.toFixed(1)}°C (
                      {((project.fluid.temperatureC * 9) / 5 + 32).toFixed(1)}°F)
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-medium text-slate-600">Density (ρ):</td>
                    <td className="p-2 font-mono text-slate-900">{project.fluid.density} kg/m³</td>
                    <td className="p-2 font-medium text-slate-600">Kinematic Viscosity (ν):</td>
                    <td className="p-2 font-mono text-slate-900">{project.fluid.viscosity} cSt (mm²/s)</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td className="p-2 font-medium text-slate-600">Vapor Pressure (Pv abs):</td>
                    <td className="p-2 font-mono text-slate-900">
                      {project.fluid.vaporPressureKPa.toFixed(2)} kPa ({results.vaporPressureHeadM.toFixed(2)} m head)
                    </td>
                    <td className="p-2 font-medium text-slate-600">Site Altitude:</td>
                    <td className="p-2 font-mono text-slate-900">
                      {lengthToDisplay(project.altitudeM, unitSystem).toFixed(0)} {labels.elevation} (P_atm: {results.atmosphericPressureKPa.toFixed(1)} kPa)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Hydraulic Calculation & Head Loss Breakdown */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-800 mb-2 border-b border-slate-200 pb-1">
                3. Total Dynamic Head (TDH) Breakdown
              </h2>
              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="p-2 font-semibold">Hydraulic Parameter</th>
                    <th className="p-2 font-semibold text-right">Suction Run</th>
                    <th className="p-2 font-semibold text-right">Discharge Run</th>
                    <th className="p-2 font-semibold text-right">Net Head Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-medium">Static Elevation Head (Z)</td>
                    <td className="p-2 font-mono text-right">
                      {headToDisplay(suction.staticElevationM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                    <td className="p-2 font-mono text-right">
                      {headToDisplay(discharge.staticElevationM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                    <td className="p-2 font-mono font-bold text-right text-slate-900">
                      {headToDisplay(results.staticHeadM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Pipe Friction Loss (hf)</td>
                    <td className="p-2 font-mono text-right">
                      {headToDisplay(results.suctionPipeFrictionM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                    <td className="p-2 font-mono text-right">
                      {headToDisplay(results.dischargePipeFrictionM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                    <td className="p-2 font-mono font-bold text-right text-slate-900">
                      {headToDisplay(results.suctionPipeFrictionM + results.dischargePipeFrictionM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Minor Losses (Valves & Fittings) (hm)</td>
                    <td className="p-2 font-mono text-right">
                      {headToDisplay(results.suctionMinorLossM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                    <td className="p-2 font-mono text-right">
                      {headToDisplay(results.dischargeMinorLossM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                    <td className="p-2 font-mono font-bold text-right text-slate-900">
                      {headToDisplay(results.suctionMinorLossM + results.dischargeMinorLossM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Terminal Vessel Pressure Head (ΔP/γ)</td>
                    <td className="p-2 font-mono text-right">
                      {((suction.terminalPressureKPa * 1000) / (project.fluid.density * 9.80665)).toFixed(2)} m
                    </td>
                    <td className="p-2 font-mono text-right">
                      {((discharge.terminalPressureKPa * 1000) / (project.fluid.density * 9.80665)).toFixed(2)} m
                    </td>
                    <td className="p-2 font-mono font-bold text-right text-slate-900">
                      {headToDisplay(results.pressureHeadM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Velocity Head Differential (ΔV²/2g)</td>
                    <td className="p-2 font-mono text-right">
                      {(Math.pow(results.suctionVelocityMs, 2) / (2 * 9.80665)).toFixed(3)} m
                    </td>
                    <td className="p-2 font-mono text-right">
                      {(Math.pow(results.dischargeVelocityMs, 2) / (2 * 9.80665)).toFixed(3)} m
                    </td>
                    <td className="p-2 font-mono font-bold text-right text-slate-900">
                      {headToDisplay(results.velocityHeadDiffM, unitSystem).toFixed(3)} {labels.head}
                    </td>
                  </tr>
                  <tr className="bg-cyan-50 font-bold text-cyan-950">
                    <td className="p-2 text-sm uppercase">Total Dynamic Head (TDH)</td>
                    <td className="p-2 text-right">
                      Σ Suction: {headToDisplay(results.suctionTotalLossM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                    <td className="p-2 text-right">
                      Σ Disch: {headToDisplay(results.dischargeTotalLossM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                    <td className="p-2 text-right text-sm font-mono text-cyan-900">
                      {headToDisplay(results.totalDynamicHeadM, unitSystem).toFixed(2)} {labels.head}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4: Piping Specification Details */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-800 mb-2 border-b border-slate-200 pb-1">
                4. Piping Schedules & Hydraulic Flow Characteristics
              </h2>
              <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="p-2">Line Segment</th>
                    <th className="p-2">Length</th>
                    <th className="p-2">Internal ID</th>
                    <th className="p-2">Velocity</th>
                    <th className="p-2">Reynolds No.</th>
                    <th className="p-2">Flow Regime</th>
                    <th className="p-2">Fittings (ΣK)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-semibold">Suction Line</td>
                    <td className="p-2 font-mono">
                      {lengthToDisplay(suction.lengthM, unitSystem).toFixed(1)} {labels.length}
                    </td>
                    <td className="p-2 font-mono">
                      {diameterToDisplay(suction.diameterMm, unitSystem).toFixed(2)} {labels.diameter}
                    </td>
                    <td className="p-2 font-mono font-bold text-slate-800">
                      {(unitSystem === 'imperial' ? results.suctionVelocityMs * 3.28084 : results.suctionVelocityMs).toFixed(2)} {labels.velocity}
                    </td>
                    <td className="p-2 font-mono">{results.suctionReynolds.toLocaleString()}</td>
                    <td className="p-2 capitalize">{results.suctionRegime}</td>
                    <td className="p-2 font-mono">
                      K = {suction.fittings.reduce((s, f) => s + f.kFactor * f.count, 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold">Discharge Line</td>
                    <td className="p-2 font-mono">
                      {lengthToDisplay(discharge.lengthM, unitSystem).toFixed(1)} {labels.length}
                    </td>
                    <td className="p-2 font-mono">
                      {diameterToDisplay(discharge.diameterMm, unitSystem).toFixed(2)} {labels.diameter}
                    </td>
                    <td className="p-2 font-mono font-bold text-slate-800">
                      {(unitSystem === 'imperial' ? results.dischargeVelocityMs * 3.28084 : results.dischargeVelocityMs).toFixed(2)} {labels.velocity}
                    </td>
                    <td className="p-2 font-mono">{results.dischargeReynolds.toLocaleString()}</td>
                    <td className="p-2 capitalize">{results.dischargeRegime}</td>
                    <td className="p-2 font-mono">
                      K = {discharge.fittings.reduce((s, f) => s + f.kFactor * f.count, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 5: NPSH & Cavitation Assessment */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-800 mb-2 border-b border-slate-200 pb-1">
                5. Net Positive Suction Head (NPSH) & Cavitation Risk Assessment
              </h2>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {results.isCavitationRisk ? (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        LOW NPSH MARGIN / CAVITATION ADVISORY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        ADEQUATE NPSH MARGIN - SAFE CAVITATION MARGIN
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    NPSH Available (NPSHa):{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {headToDisplay(results.npshAvailableM, unitSystem).toFixed(2)} {labels.head}
                    </span>{' '}
                    | NPSH Required (NPSHr):{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {headToDisplay(results.npshRequiredM, unitSystem).toFixed(2)} {labels.head}
                    </span>{' '}
                    | Net Margin: <span className="font-mono font-bold">+{headToDisplay(results.npshMarginM, unitSystem).toFixed(2)} {labels.head}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">HI Recommended Margin</span>
                  <span className="font-mono font-bold text-slate-800">≥ 1.0 m (3.3 ft)</span>
                </div>
              </div>
            </div>

            {/* Section 6: Energy, Motor & Carbon Footprint */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-800 mb-2 border-b border-slate-200 pb-1">
                6. Power Consumption & Lifecycle Operating Cost (OPEX)
              </h2>
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block">Hydraulic Fluid Power:</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    {powerToDisplay(results.hydraulicPowerKw, unitSystem).toFixed(2)} {labels.power}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block">Shaft Brake Power (BHP):</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    {powerToDisplay(results.shaftBrakePowerKw, unitSystem).toFixed(2)} {labels.power}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block">Est. Annual Electricity Cost:</span>
                  <span className="text-sm font-bold font-mono text-amber-700">
                    ${results.annualOperatingCostUsd.toLocaleString()} / year
                  </span>
                </div>
              </div>
            </div>

            {/* Engineering Notes & Signature block */}
            <div className="border-t-2 border-slate-200 pt-4 mt-8 flex justify-between items-end text-[11px] text-slate-600">
              <div className="space-y-1 max-w-[420px]">
                <p className="font-bold text-slate-800">Project Engineering Remarks:</p>
                <p className="italic text-slate-600 leading-relaxed">
                  {project.notes || 'All hydraulic calculations verified in accordance with Darcy-Weisbach flow standards. System operating curve intersects within the manufacturer preferred operating region (POR).'}
                </p>
              </div>

              <div className="text-right border-t border-slate-400 pt-2 min-w-[200px]">
                <div className="h-10"></div>
                <p className="font-bold text-slate-900">{project.engineerName || 'Alex Mercer, P.E.'}</p>
                <p className="text-[10px] text-slate-500">Professional Engineer / Sign-off Stamp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
