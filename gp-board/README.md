# GP Board

Monthly gross profit and KPI tracker for wireless retail sales. Backup of the page published at
https://claude.ai/artifact/5nHiwZHpMh2vqAtb8MGe76

`gp-board.html` is the page source. It saves entries through the Claude artifact database, so it only
stores data when published as a Claude artifact; opened as a plain file it shows the layout but can't save.

## What it tracks

- **Net GP** against a monthly goal (default $15,000), with pace, needed-per-day and month-end projection.
- **Entry types:** Sale, Perks only, Chargeback, Other GP. Sales and Perks only require a sales application #.
- **Pay statement check:** compares the GP payroll credited to the GP logged.
- **History page:** totals for any month or all time, month-by-month table, searchable list, CSV export.

## KPI rules

| KPI | Formula | Default target |
| --- | --- | --- |
| Phone adds | count of new lines | 14 |
| Home internet | count | 4 |
| Premium % | premium plans ÷ phones sold (new lines + upgrades). Tablets and watches don't count. | 60% |
| VMP % | VMP added ÷ opportunities. Opportunities are phones and tablets sold without VMP. VMP on watches is +1 with no opportunity. | 65% |
| Perks % | perks added ÷ opportunities. Every new line is an opportunity, plus each other line with a plan change. Perks only entries are +perks with no opportunity. | 69% |
| Pull thru % | tablets + watches ÷ sales. Every sale is one opportunity. | 15% |

Chargebacks subtract GP and any KPI counts in the month they're dated. They never count as a sale or
change opportunities. Targets are saved per month; a new month starts with the last targets saved.

## Data stored

- `settings/main` – default goal, commission %, targets
- `months/<YYYY-MM>` – that month's goal, targets and pay statement GP
- `entries/<id>` – one document per entry (date, month, kind, app, desc, gp, phone, upg, hint, tab,
  watch, pull, prem, vmpOpp, vmpLines, vmpWatch, planChanges, perksOpp, perks)
