/**
 * PDF Report Generator for Physical Activity Agent Movement Evaluation
 * Opens a clean, print-ready HTML document window formatted for saving as PDF or printing.
 */

export function generatePosePDFReport(evaluationResult, userName = 'Molly') {
  if (!evaluationResult) return;

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const printWindow = window.open('', '_blank', 'width=900,height=1100');
  if (!printWindow) {
    alert('Please allow popups to open and download the PDF report.');
    return;
  }

  const {
    poseName,
    overallAccuracy,
    formGrade,
    badgeColor,
    measuredAngles,
    feedbackList
  } = evaluationResult;

  const gradeColorHex =
    badgeColor === 'emerald' ? '#059669' :
    badgeColor === 'amber' ? '#d97706' : '#dc2626';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>AarogyaMitra — Physical Activity Movement Report (${poseName})</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #ffffff;
            color: #1e293b;
            padding: 40px;
            line-height: 1.6;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #0f766e;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .doc-title {
            text-align: right;
          }
          .doc-title h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
          .doc-title p { font-size: 12px; color: #94a3b8; }
          
          .patient-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .info-group label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; display: block; }
          .info-group span { font-size: 14px; font-weight: 700; color: #0f172a; }

          .hero-score-box {
            background: #f0fdf4;
            border: 2px solid ${gradeColorHex};
            border-radius: 16px;
            padding: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .score-left h3 { font-size: 18px; font-weight: 800; color: #0f172a; }
          .score-left p { font-size: 13px; color: #475569; margin-top: 4px; }
          .score-badge {
            text-align: right;
          }
          .score-number { font-size: 42px; font-weight: 900; color: ${gradeColorHex}; }
          .score-label {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            background: ${gradeColorHex};
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
          }

          .section-title {
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #0f766e;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 30px;
          }
          .metric-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 16px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .metric-card label { font-size: 12px; font-weight: 600; color: #475569; }
          .metric-card span { font-size: 14px; font-weight: 800; color: #0f172a; }

          .feedback-box {
            background: #fff;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .feedback-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 13px;
            color: #334155;
            padding: 8px 0;
            border-bottom: 1px border #f1f5f9;
          }
          .feedback-item:last-child { border-bottom: none; }
          .bullet { color: #0f766e; font-weight: 900; }

          .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            font-size: 11px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }

          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #0f766e; color: #fff; border: none; padding: 10px 20px; font-size: 14px; font-weight: 700; border-radius: 8px; cursor: pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div class="logo">
            <span>🌿 AarogyaMitra</span>
          </div>
          <div class="doc-title">
            <h2>Movement Performance Report</h2>
            <p>Physical Activity AI Agent</p>
          </div>
        </div>

        <div class="patient-card">
          <div class="info-group">
            <label>User Name</label>
            <span>${userName}</span>
          </div>
          <div class="info-group">
            <label>Evaluated Pose</label>
            <span>${poseName}</span>
          </div>
          <div class="info-group">
            <label>Assessment Date</label>
            <span>${dateStr}</span>
          </div>
        </div>

        <div class="hero-score-box">
          <div class="score-left">
            <h3>Pose Biomechanical Accuracy</h3>
            <p>MoveNet 17-Keypoint Joint Alignment Analysis</p>
          </div>
          <div class="score-badge">
            <div class="score-number">${overallAccuracy}%</div>
            <div class="score-label">${formGrade}</div>
          </div>
        </div>

        <div class="section-title">Measured Joint Angles & Alignment</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <label>Left Knee Extension</label>
            <span>${measuredAngles.leftKnee || 0}°</span>
          </div>
          <div class="metric-card">
            <label>Right Knee Extension</label>
            <span>${measuredAngles.rightKnee || 0}°</span>
          </div>
          <div class="metric-card">
            <label>Left Hip Angle</label>
            <span>${measuredAngles.leftHip || 0}°</span>
          </div>
          <div class="metric-card">
            <label>Right Hip Angle</label>
            <span>${measuredAngles.rightHip || 0}°</span>
          </div>
          <div class="metric-card">
            <label>Vertical Spine Tilt</label>
            <span>${measuredAngles.spineTilt || 0}°</span>
          </div>
          <div class="metric-card">
            <label>Arm Elevation (Average)</label>
            <span>${Math.round(((measuredAngles.leftArmElevation || 0) + (measuredAngles.rightArmElevation || 0)) / 2)}°</span>
          </div>
        </div>

        <div class="section-title">Biomechanical Feedback & What Needs Improvement</div>
        <div class="feedback-box">
          ${feedbackList.map(item => `
            <div class="feedback-item">
              <span class="bullet">•</span>
              <span>${item}</span>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <div>AarogyaMitra AI Movement Assessment System • MoveNet Architecture</div>
          <div>Clinical Indicator — Not a diagnostic medical document</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
