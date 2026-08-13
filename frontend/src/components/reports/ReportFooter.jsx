import { formatGeneratedAt } from '../../utils/reportFormatter';
import { REPORT_CONFIDENTIALITY_NOTICE } from '../../utils/orgInfo';

export default function ReportFooter({ generatedAt }) {
  return (
    <div className="report-running-footer hidden items-center justify-between border-t border-slate-300 pt-1 text-[9px] text-slate-400 print:flex">
      <span className="max-w-[70%]">{REPORT_CONFIDENTIALITY_NOTICE}</span>
      <span className="font-id">Generated {formatGeneratedAt(generatedAt)}</span>
    </div>
  );
}
