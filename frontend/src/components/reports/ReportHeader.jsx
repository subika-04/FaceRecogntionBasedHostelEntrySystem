import { ORG_SHORT } from '../../utils/orgInfo';

// title: report title shown in the running header on every printed page
export default function ReportHeader({ title }) {
  return (
    <div className="report-running-header hidden items-center justify-between border-b border-slate-300 pb-1 text-[10px] text-slate-500 print:flex">
      <span>{ORG_SHORT}</span>
      <span>{title}</span>
    </div>
  );
}
