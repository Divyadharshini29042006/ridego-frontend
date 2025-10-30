import { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import styles from '../../styles/ManagerQueryDashboard.module.css';

export default function ManagerQueryDashboard() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/contact/manager/assigned', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setQueries(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching queries:', err);
      setError('Failed to fetch assigned queries');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (queryId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/contact/manager/update-status/${queryId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update status');

      alert('Status updated successfully');
      fetchQueries();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const submitReply = async () => {
    if (!replyText.trim()) {
      alert('Please enter a reply');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/contact/manager/update-status/${selectedQuery._id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            status: 'completed',
            reply: replyText 
          })
        }
      );

      if (!response.ok) throw new Error('Failed to send reply');

      alert('Reply sent successfully');
      setShowReplyModal(false);
      setReplyText('');
      setSelectedQuery(null);
      fetchQueries();
    } catch (err) {
      alert('Error sending reply');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className={styles.w4} />;
      case 'in-progress': return <Clock className={styles.w4} />;
      case 'overdue': return <XCircle className={styles.w4} />;
      default: return <AlertCircle className={styles.w4} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return `${styles.bgGreen100} ${styles.textGreen800}`;
      case 'in-progress': return `${styles.bgBlue100} ${styles.textBlue800}`;
      case 'overdue': return `${styles.bgRed100} ${styles.textRed600}`;
      default: return `${styles.bgYellow100} ${styles.textYellow800}`;
    }
  };

  const pendingQueries = queries.filter(q => q.status === 'pending').length;
  const inProgressQueries = queries.filter(q => q.status === 'in-progress').length;
  const completedQueries = queries.filter(q => q.status === 'completed').length;

  if (loading) {
    return (
      <div className={`${styles.minHScreen} ${styles.bgGradientToBr} ${styles.fromSlate50} ${styles.viaWhite} ${styles.toBlue50} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter}`}>
        <div className={styles.textCenter}>
          <div className={`${styles.w12} ${styles.h12} ${styles.border4} ${styles.borderBlue600} ${styles.borderTTransparent} ${styles.roundedFull} ${styles.animateSpin} ${styles.mxAuto} ${styles.mb4}`}></div>
          <p className={styles.textGray600}>Loading your assigned queries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.minHScreen} ${styles.bgGradientToBr} ${styles.fromSlate50} ${styles.viaWhite} ${styles.toBlue50} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.p4}`}>
        <div className={`${styles.bgRed50} ${styles.border} ${styles.borderRed200} ${styles.rounded2xl} ${styles.p8} ${styles.maxWmd} ${styles.textCenter}`}>
          <div className={`${styles.w16} ${styles.h16} ${styles.bgRed100} ${styles.roundedFull} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.mxAuto} ${styles.mb4}`}>
            <XCircle className={`${styles.w8} ${styles.h8} ${styles.textRed600}`} />
          </div>
          <h3 className={`${styles.textXl} ${styles.fontSemibold} ${styles.textRed900} ${styles.mb2}`}>Error</h3>
          <p className={`${styles.textRed700} ${styles.mb4}`}>{error}</p>
          <button
            onClick={fetchQueries}
            className={`${styles.px6Btn} ${styles.py2} ${styles.bgRed600} ${styles.textWhite} ${styles.roundedLg} ${styles.hoverBgRed700} ${styles.transition}`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.minHScreen} ${styles.bgGradientToBr} ${styles.fromSlate50} ${styles.viaWhite} ${styles.toBlue50}`}>
      {/* Header */}
      <div className={`${styles.bgWhite80} ${styles.backdropBlurXl} ${styles.borderB} ${styles.borderGray200} ${styles.sticky} ${styles.top0} ${styles.z10}`}>
        <div className={`${styles.maxW7xl} ${styles.mxAuto} ${styles.px6} ${styles.py6}`}>
          <div className={`${styles.flex} ${styles.itemsCenter} ${styles.gap4}`}>
            <div className={`${styles.w12} ${styles.h12} ${styles.bgGradientToBrIcon} ${styles.fromBlue600} ${styles.toPurple600} ${styles.roundedXl} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter}`}>
              <MessageSquare className={`${styles.w6} ${styles.h6} ${styles.textWhite}`} />
            </div>
            <div>
              <h1 className={`${styles.text2xl} ${styles.fontBold} ${styles.textGray900}`}>My Assigned Queries</h1>
              <p className={`${styles.textSm} ${styles.textGray600}`}>Manage queries from your location</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.maxW7xl} ${styles.mxAuto} ${styles.px6} ${styles.py8}`}>
        {/* Stats */}
        <div className={`${styles.grid} ${styles.gridCols1} ${styles.mdGridCols3} ${styles.gap6} ${styles.mb8}`}>
          <div className={`${styles.bgWhite} ${styles.rounded2xl} ${styles.p6} ${styles.shadowSm} ${styles.border} ${styles.borderGray100}`}>
            <div className={`${styles.flex} ${styles.itemsCenter} ${styles.justifyBetween}`}>
              <div>
                <p className={`${styles.textSm} ${styles.textGray600} ${styles.mb1}`}>Pending</p>
                <h3 className={`${styles.text3xl} ${styles.fontBold} ${styles.textGray900}`}>{pendingQueries}</h3>
              </div>
              <div className={`${styles.w12} ${styles.h12} ${styles.bgYellow100} ${styles.roundedXl} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter}`}>
                <AlertCircle className={`${styles.w6} ${styles.h6} ${styles.textYellow600}`} />
              </div>
            </div>
          </div>

          <div className={`${styles.bgWhite} ${styles.rounded2xl} ${styles.p6} ${styles.shadowSm} ${styles.border} ${styles.borderGray100}`}>
            <div className={`${styles.flex} ${styles.itemsCenter} ${styles.justifyBetween}`}>
              <div>
                <p className={`${styles.textSm} ${styles.textGray600} ${styles.mb1}`}>In Progress</p>
                <h3 className={`${styles.text3xl} ${styles.fontBold} ${styles.textGray900}`}>{inProgressQueries}</h3>
              </div>
              <div className={`${styles.w12} ${styles.h12} ${styles.bgBlue100} ${styles.roundedXl} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter}`}>
                <Clock className={`${styles.w6} ${styles.h6} ${styles.textBlue600}`} />
              </div>
            </div>
          </div>

          <div className={`${styles.bgWhite} ${styles.rounded2xl} ${styles.p6} ${styles.shadowSm} ${styles.border} ${styles.borderGray100}`}>
            <div className={`${styles.flex} ${styles.itemsCenter} ${styles.justifyBetween}`}>
              <div>
                <p className={`${styles.textSm} ${styles.textGray600} ${styles.mb1}`}>Completed</p>
                <h3 className={`${styles.text3xl} ${styles.fontBold} ${styles.textGray900}`}>{completedQueries}</h3>
              </div>
              <div className={`${styles.w12} ${styles.h12} ${styles.bgGreen100} ${styles.roundedXl} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter}`}>
                <CheckCircle className={`${styles.w6} ${styles.h6} ${styles.textGreen600}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Queries Table */}
        <div className={`${styles.bgWhite} ${styles.rounded2xl} ${styles.shadowSm} ${styles.border} ${styles.borderGray100} ${styles.overflowHidden}`}>
          <div className={`${styles.px6} ${styles.py4} ${styles.borderB} ${styles.borderGray100} ${styles.bgGradientToR} ${styles.fromGray50} ${styles.toBlue50Table}`}>
            <h2 className={`${styles.textLg} ${styles.fontSemibold} ${styles.textGray900}`}>Query List</h2>
          </div>

          {queries.length === 0 ? (
            <div className={`${styles.p12} ${styles.textCenter}`}>
              <div className={`${styles.w20} ${styles.h20} ${styles.bgGray100} ${styles.roundedFull} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.mxAuto} ${styles.mb4}`}>
                <MessageSquare className={`${styles.w10} ${styles.h10} ${styles.textGray400}`} />
              </div>
              <h3 className={`${styles.textLg} ${styles.fontSemibold} ${styles.textGray900} ${styles.mb2}`}>No Queries Assigned</h3>
              <p className={styles.textGray600}>You don't have any queries assigned to your location yet.</p>
            </div>
          ) : (
            <div className={styles.overflowXAuto}>
              <table className={styles.wFull}>
                <thead className={styles.bgGray50}>
                  <tr>
                    <th className={`${styles.px6} ${styles.py3} ${styles.textLeft} ${styles.textXs} ${styles.fontSemibold} ${styles.textGray700} ${styles.uppercase}`}>User</th>
                    <th className={`${styles.px6} ${styles.py3} ${styles.textLeft} ${styles.textXs} ${styles.fontSemibold} ${styles.textGray700} ${styles.uppercase}`}>Issue</th>
                    <th className={`${styles.px6} ${styles.py3} ${styles.textLeft} ${styles.textXs} ${styles.fontSemibold} ${styles.textGray700} ${styles.uppercase}`}>Location</th>
                    <th className={`${styles.px6} ${styles.py3} ${styles.textLeft} ${styles.textXs} ${styles.fontSemibold} ${styles.textGray700} ${styles.uppercase}`}>Status</th>
                    <th className={`${styles.px6} ${styles.py3} ${styles.textLeft} ${styles.textXs} ${styles.fontSemibold} ${styles.textGray700} ${styles.uppercase}`}>Date</th>
                    <th className={`${styles.px6} ${styles.py3} ${styles.textLeft} ${styles.textXs} ${styles.fontSemibold} ${styles.textGray700} ${styles.uppercase}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.divideGray100}>
                  {queries.map((query) => (
                    <tr key={query._id} className={`${styles.hoverBgGray50} ${styles.transition}`}>
                      <td className={`${styles.px6} ${styles.py4}`}>
                        <div>
                          <p className={`${styles.fontMedium} ${styles.textGray900}`}>{query.userId?.name || 'N/A'}</p>
                          <p className={`${styles.textSm} ${styles.textGray500}`}>{query.userId?.email}</p>
                          <p className={`${styles.textSm} ${styles.textGray500}`}>{query.mobile}</p>
                        </div>
                      </td>
                      <td className={`${styles.px6} ${styles.py4}`}>
                        <p className={`${styles.fontMedium} ${styles.textGray900} ${styles.capitalize}`}>{query.issue.replace('-', ' ')}</p>
                        <p className={`${styles.textSm} ${styles.textGray600} ${styles.lineClamp2}`}>{query.comments}</p>
                      </td>
                      <td className={`${styles.px6} ${styles.py4}`}>
                        <p className={`${styles.textSm} ${styles.fontMedium} ${styles.textGray900}`}>{query.city}</p>
                        <p className={`${styles.textXs} ${styles.textGray500}`}>{query.subLocation}</p>
                      </td>
                      <td className={`${styles.px6} ${styles.py4}`}>
                        <span className={`${styles.inlineFlex} ${styles.itemsCenter} ${styles.gap1} ${styles.px3} ${styles.py1} ${styles.roundedFull} ${styles.textXs} ${styles.fontSemibold} ${getStatusClass(query.status)}`}>
                          {getStatusIcon(query.status)}
                          {query.status}
                        </span>
                      </td>
                      <td className={`${styles.px6} ${styles.py4} ${styles.textSm} ${styles.textGray600}`}>
                        {new Date(query.createdAt).toLocaleDateString()}
                      </td>
                      <td className={`${styles.px6} ${styles.py4}`}>
                        <div className={`${styles.flex} ${styles.gap2}`}>
                          {query.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(query._id, 'in-progress')}
                              className={`${styles.px3} ${styles.py1} ${styles.bgBlue600} ${styles.textWhite} ${styles.textXs} ${styles.roundedLg} ${styles.hoverBgBlue700} ${styles.transition}`}
                            >
                              Start
                            </button>
                          )}
                          {query.status === 'in-progress' && (
                            <button
                              onClick={() => {
                                setSelectedQuery(query);
                                setShowReplyModal(true);
                              }}
                              className={`${styles.px3} ${styles.py1} ${styles.bgGreen600} ${styles.textWhite} ${styles.textXs} ${styles.roundedLg} ${styles.hoverBgGreen700} ${styles.transition}`}
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className={`${styles.fixed} ${styles.inset0} ${styles.bgBlack50} ${styles.backdropBlurSm} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.z50} ${styles.p4}`}>
          <div className={`${styles.bgWhite} ${styles.rounded2xl} ${styles.maxW2xl} ${styles.wFull} ${styles.p6} ${styles.shadow2xl}`}>
            <h3 className={`${styles.textXl} ${styles.fontBold} ${styles.textGray900} ${styles.mb4}`}>Send Reply</h3>
            
            <div className={`${styles.mb4} ${styles.p4} ${styles.bgGray50} ${styles.roundedLg}`}>
              <p className={`${styles.textSm} ${styles.textGray600} ${styles.mb1}`}>User: <span className={`${styles.fontMedium} ${styles.textGray900}`}>{selectedQuery?.userId?.name}</span></p>
              <p className={`${styles.textSm} ${styles.textGray600} ${styles.mb2}`}>Issue: <span className={`${styles.fontMedium} ${styles.textGray900}`}>{selectedQuery?.issue}</span></p>
              <p className={`${styles.textSm} ${styles.textGray600}`}>Query: <span className={styles.textGray700Util}>{selectedQuery?.comments}</span></p>
            </div>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response here..."
              className={`${styles.wFull} ${styles.h32} ${styles.px3} ${styles.py3} ${styles.border} ${styles.borderGray300} ${styles.roundedLg} ${styles.focusRing2} ${styles.focusRingBlue500} ${styles.focusBorderTransparent} ${styles.resizeNone}`}
            />

            <div className={`${styles.flex} ${styles.gap3} ${styles.mt4}`}>
              <button
                onClick={submitReply}
                className={`${styles.flex1} ${styles.px6Btn} ${styles.py3} ${styles.bgBlue600} ${styles.textWhite} ${styles.roundedLg} ${styles.hoverBgBlue700} ${styles.transition} ${styles.fontMedium}`}
              >
                Send Reply
              </button>
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyText('');
                  setSelectedQuery(null);
                }}
                className={`${styles.px6Btn} ${styles.py3} ${styles.bgGray200} ${styles.textGray700Util} ${styles.roundedLg} ${styles.hoverBgGray300} ${styles.transition} ${styles.fontMedium}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}