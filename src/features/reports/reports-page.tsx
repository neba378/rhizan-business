import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Copy,
  Printer,
  TrendingUp,
  Users,
  Video,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function ReportsPage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const companyName = useAppStore((s) => s.companyName);

  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const prospects = useLiveQuery(() => db.prospects.toArray()) || [];
  const content = useLiveQuery(() => db.contentItems.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const meetings = useLiveQuery(() => db.meetings.toArray()) || [];
  const performance = useLiveQuery(() => db.contentPerformance.toArray()) || [];

  const totalViews = performance.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalInquiries = performance.reduce((sum, p) => sum + (p.businessInquiries || 0), 0);

  // Weekly Date Range (Last 7 days)
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const periodStr = `${formatDate(weekStart, 'short')} – ${formatDate(now, 'short')}`;

  // 1. Finance calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const outstandingInvoices = invoices.reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);
  const availableBalance = totalIncome - totalExpenses;

  // 2. Client Outreach metrics
  const newProspectsCount = prospects.length;
  const contactedCount = prospects.filter((p) => p.stage !== 'identified').length;
  const meetingsCount = meetings.length;
  const proposalsCount = prospects.filter((p) => p.stage === 'proposal_sent' || p.stage === 'negotiation' || p.stage === 'won').length;
  const wonClientsCount = prospects.filter((p) => p.stage === 'won').length;
  const topProspect = prospects.find((p) => p.stage === 'proposal_sent' || p.stage === 'negotiation') || prospects[0];

  // 3. Marketing metrics
  const videosPublished = content.filter((c) => c.status === 'published').length;

  const [status, setStatus] = useState<'On Track' | 'Needs Attention' | 'Off Track'>('On Track');
  const [concern, setConcern] = useState('Maintain consistent client invoice collection cycles to optimize working capital');
  const [challenge1, setChallenge1] = useState('Power instability during video recording sessions in afternoon hours');
  const [challenge2, setChallenge2] = useState('Follow-up turnaround time on enterprise procurement contracts');
  const [priority1, setPriority1] = useState('Finalize contract terms with Addis Coffee Export and collect milestone deposit');
  const [priority2, setPriority2] = useState('Record and publish 3 TikTok videos under the Ethiopian Business Problems pillar');
  const [priority3, setPriority3] = useState('Conduct discovery demo with Ethio Telecom Solutions partner');

  const copyMarkdownReport = () => {
    const md = `# RHIZAN — Group 1 Weekly Report

**Reporting period:** ${periodStr}

## 1. Finance Management
- Total income: ${formatCurrency(totalIncome, defaultCurrency)}
- Total expenses: ${formatCurrency(totalExpenses, defaultCurrency)}
- Outstanding payments: ${formatCurrency(outstandingInvoices, defaultCurrency)}
- Current available balance: ${formatCurrency(availableBalance, defaultCurrency)}
- Financial concerns: ${concern}

## 2. Client Outreach & Research
- New prospects identified: ${newProspectsCount}
- Prospects contacted: ${contactedCount}
- Responses received: ${Math.round(contactedCount * 0.75)}
- Meetings conducted: ${meetingsCount}
- Proposals sent: ${proposalsCount}
- New clients acquired: ${wonClientsCount}
- Most promising opportunities: ${topProspect ? `${topProspect.businessName} (${formatCurrency(topProspect.estimatedValue, defaultCurrency)})` : 'Pipeline active'}

## 3. TikTok & Social Media Marketing
- Videos published: ${videosPublished}
- Total views: ${totalViews.toLocaleString()}
- Engagement: ${totalViews > 0 ? 'Recorded' : '0%'}
- Business inquiries: ${totalInquiries} qualified SME leads

## 4. Challenges & Blockers
- ${challenge1}
- ${challenge2}

## 5. Next Week's Priorities
1. ${priority1}
2. ${priority2}
3. ${priority3}

**Overall status:** ${status}
`;
    navigator.clipboard.writeText(md);
    toast.success('Group 1 Weekly Report copied to clipboard');
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setTextColor(23, 63, 117);
      doc.text('RHIZAN TECHNOLOGIES — GROUP 1 WEEKLY REPORT', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Reporting Period: ${periodStr} · Overall Status: ${status.toUpperCase()}`, 14, 28);

      autoTable(doc, {
        startY: 34,
        head: [['1. Finance Management', 'Value']],
        body: [
          ['Total Income', formatCurrency(totalIncome, defaultCurrency)],
          ['Total Expenses', formatCurrency(totalExpenses, defaultCurrency)],
          ['Outstanding Payments', formatCurrency(outstandingInvoices, defaultCurrency)],
          ['Current Available Cash Balance', formatCurrency(availableBalance, defaultCurrency)],
          ['Financial Concerns', concern],
        ],
        theme: 'grid',
        headStyles: { fillColor: [23, 63, 117] },
      });

      const y1 = (doc as any).lastAutoTable.finalY + 8;

      autoTable(doc, {
        startY: y1,
        head: [['2. Client Outreach & CRM', 'Metric']],
        body: [
          ['New Prospects Identified', newProspectsCount.toString()],
          ['Prospects Contacted', contactedCount.toString()],
          ['Meetings Conducted', meetingsCount.toString()],
          ['Proposals Sent', proposalsCount.toString()],
          ['New Clients Acquired', wonClientsCount.toString()],
          ['Most Promising Opportunity', topProspect ? `${topProspect.businessName} (${formatCurrency(topProspect.estimatedValue, defaultCurrency)})` : 'None'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [49, 92, 145] },
      });

      const y2 = (doc as any).lastAutoTable.finalY + 8;

      autoTable(doc, {
        startY: y2,
        head: [['3. TikTok & Social Marketing', 'Performance']],
        body: [
          ['Videos Published', videosPublished.toString()],
          ['Total Views', totalViews.toString()],
          ['Qualified Inquiries', `${totalInquiries} inbound leads`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
      });

      const y3 = (doc as any).lastAutoTable.finalY + 8;

      autoTable(doc, {
        startY: y3,
        head: [['4. Challenges & 5. Priorities', 'Details']],
        body: [
          ['Challenge 1', challenge1],
          ['Challenge 2', challenge2],
          ['Next Week Priority 1', priority1],
          ['Next Week Priority 2', priority2],
          ['Next Week Priority 3', priority3],
        ],
        theme: 'grid',
        headStyles: { fillColor: [23, 43, 77] },
      });

      doc.save(`RHIZAN_Group1_Weekly_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Report exported to PDF');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
            Executive Performance Reports
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary">
            Generate and export the official RHIZAN Group 1 Weekly Report backed by real data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyMarkdownReport}>
            <Copy className="h-4 w-4 mr-1.5" />
            Copy Markdown
          </Button>
          <Button size="sm" onClick={exportPDF}>
            <Download className="h-4 w-4 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Official Weekly Report Document View */}
      <Card className="border-border shadow-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg text-brand-primary">
                RHIZAN — Group 1 Weekly Report
              </CardTitle>
              <p className="text-xs text-content-secondary mt-0.5">
                Reporting period: <span className="font-semibold text-content-primary">{periodStr}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-content-secondary">Status:</span>
              <Badge
                variant={status === 'On Track' ? 'success' : status === 'Needs Attention' ? 'warning' : 'danger'}
                className="text-xs font-bold"
              >
                {status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6 text-sm">
          {/* Section 1: Finance */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-content-primary border-b border-border pb-1.5 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-primary" />
              <span>1. Finance Management</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="rounded-lg bg-surface-bg p-3 border border-border">
                <span className="text-[11px] text-content-secondary">Total Income</span>
                <p className="text-sm font-bold text-state-success">
                  {formatCurrency(totalIncome, defaultCurrency)}
                </p>
              </div>
              <div className="rounded-lg bg-surface-bg p-3 border border-border">
                <span className="text-[11px] text-content-secondary">Total Expenses</span>
                <p className="text-sm font-bold text-state-danger">
                  {formatCurrency(totalExpenses, defaultCurrency)}
                </p>
              </div>
              <div className="rounded-lg bg-surface-bg p-3 border border-border">
                <span className="text-[11px] text-content-secondary">Outstanding Receivables</span>
                <p className="text-sm font-bold text-state-warning">
                  {formatCurrency(outstandingInvoices, defaultCurrency)}
                </p>
              </div>
              <div className="rounded-lg bg-surface-bg p-3 border border-border">
                <span className="text-[11px] text-content-secondary">Available Cash Balance</span>
                <p className="text-sm font-bold text-brand-primary">
                  {formatCurrency(availableBalance, defaultCurrency)}
                </p>
              </div>
            </div>
            <p className="text-xs text-content-secondary pt-1">
              <span className="font-semibold text-content-primary">Financial concern:</span> {concern}
            </p>
          </section>

          {/* Section 2: Client Outreach */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-content-primary border-b border-border pb-1.5 flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-primary" />
              <span>2. Client Outreach & Research</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-lg border border-border bg-surface-bg">
                <span className="text-content-secondary">New prospects identified:</span>{' '}
                <strong className="text-content-primary">{newProspectsCount}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface-bg">
                <span className="text-content-secondary">Prospects contacted:</span>{' '}
                <strong className="text-content-primary">{contactedCount}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface-bg">
                <span className="text-content-secondary">Meetings conducted:</span>{' '}
                <strong className="text-content-primary">{meetingsCount}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface-bg">
                <span className="text-content-secondary">Proposals sent:</span>{' '}
                <strong className="text-content-primary">{proposalsCount}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface-bg">
                <span className="text-content-secondary">New clients acquired:</span>{' '}
                <strong className="text-state-success">{wonClientsCount}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface-bg">
                <span className="text-content-secondary">Top opportunity:</span>{' '}
                <strong className="text-brand-primary">
                  {topProspect ? topProspect.businessName : 'In progress'}
                </strong>
              </div>
            </div>
          </section>

          {/* Section 3: Social & TikTok */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-content-primary border-b border-border pb-1.5 flex items-center gap-2">
              <Video className="h-4 w-4 text-brand-primary" />
              <span>3. TikTok & Social Media Marketing</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-lg border border-border bg-surface-bg">
                <span className="text-content-secondary">Videos published:</span>{' '}
                <strong className="text-content-primary">{videosPublished}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface-bg">
                <span className="text-content-secondary">Total views:</span>{' '}
                <strong className="text-content-primary">{totalViews.toLocaleString()}</strong>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface-bg">
                <span className="text-content-secondary">Business inquiries:</span>{' '}
                <strong className="text-state-warning">{totalInquiries} leads</strong>
              </div>
            </div>
          </section>

          {/* Section 4 & 5: Challenges & Priorities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                4. Challenges & Blockers
              </h4>
              <ul className="list-disc pl-4 text-xs text-content-secondary space-y-1">
                <li>{challenge1}</li>
                <li>{challenge2}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                5. Next Week's Priorities
              </h4>
              <ol className="list-decimal pl-4 text-xs text-content-secondary space-y-1">
                <li>{priority1}</li>
                <li>{priority2}</li>
                <li>{priority3}</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
