import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Users, AlertCircle, CheckCircle, MessageSquare, Filter } from 'lucide-react';
import styles from '../../styles/AdminQueryMetrics.module.css'
export default function AdminQueryDashboard() {
  const [queries, setQueries] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);

  useEffect(() => {
    fetchQueries();
    fetchManagers();
  }, [filterStatus, filterCity, filterRole]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterCity) params.append('city', filterCity);
      if (filterRole) params.append('assignedRole', filterRole);

      const response = await fetch(
        `http://localhost:5000/api/contact/admin/all?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setQueries(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching queries:', err);
      setError('Failed to fetch queries');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users?role=manager', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
    }
  };

  const respondToQuery = async () => {
    if (!replyText.trim()) {
      alert('Please enter a reply');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/contact/admin/respond/${selectedQuery._id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reply: replyText })
        }
      );

      if (!response.ok) throw new Error('Failed to send reply');

      alert('Response sent successfully');
      setShowReplyModal(false);
      setReplyText('');
      setSelectedQuery(null);
      fetchQueries();
    } catch (err) {
      alert('Error sending response');
    }
  };

  const reassignQuery = async (queryId, managerId) => {
    if (!managerId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/contact/admin/reassign/${queryId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ managerId })
        }
      );

      if (!response.ok) throw new Error('Failed to reassign');

      alert('Query reassigned successfully');
      fetchQueries();
    } catch (err) {
      alert('Error reassigning query');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return `${styles.bgGreen100} ${styles.textGreen800}`;
      case 'in-progress': return `${styles.bgBlue100} ${styles.textBlue800}`;
      case 'overdue': return `${styles.bgRed100} ${styles.textRed800}`;
      default: return `${styles.bgYellow100} ${styles.textYellow800}`;
    }
  };

  const totalQueries = queries.length;
  const completedQueries = queries.filter(q => q.status === 'completed').length;
  const pendingQueries = queries.filter(q => q.status === 'pending').length;
  const generalQueries = queries.filter(q => q.issue === 'general-inquiry').length;

  if (loading) {
    return (
      <div className={`${styles.minHScreen} ${styles.bgGradientToBr} ${styles.fromSlate50} ${styles.viaWhite} ${styles.toBlue50} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter}`}>
        <div className={styles.textCenter}>
          <div className={`${styles.w16} ${styles.h16} ${styles.border4} ${styles.borderBlue600} ${styles.borderTTransparent} ${styles.roundedFull} ${styles.animateSpin} ${styles.mxAuto} ${styles.mb4}`}></div>
          <p className={`${styles.textGray600} ${styles.textLg}`}>Loading dashboard...</p>
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
            <div className={`${styles.w14} ${styles.h14} ${styles.bgGradientToBrIcon} ${styles.fromEmerald600} ${styles.toTeal600} ${styles.rounded2xl} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter}`}>
              <TrendingUp className={`${styles.w7} ${styles.h7} ${styles.textWhite}`} />
            </div>
            <div>
              <h1 className={`${styles.text3xl} ${styles.fontBold} ${styles.textGray900}`}>Query Management Dashboard</h1>
              <p className={styles.textGray600}>Monitor and manage all contact queries</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.maxW7xl} ${styles.mxAuto} ${styles.px6} ${styles.py8}`}>
        {/* Stats Grid */}
        <div className={`${styles.grid} ${styles.gridCols1} ${styles.mdGridCols4} ${styles.gap6} ${styles.mb8}`}>
          <div className={`${styles.bgWhite} ${styles.rounded2xl} ${styles.p6} ${styles.shadowSm} ${styles.border} ${styles.borderGray100} ${styles.hoverShadowMd} ${styles.transition}`}>
            <div className={`${styles.flex} ${styles.itemsCenter} ${styles.justifyBetween} ${styles.mb2}`}>
              <div className={`${styles.w12} ${styles.h12} ${styles.bgBlue100} ${styles.roundedXl} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter}`}>
                <MessageSquare className={`${styles.w6} ${styles.h6} ${styles.textBlue600}`} />
              </div>
            </div>
            <h3 className={`${styles.text3xl} ${styles.fontBold} ${styles.textGray900} ${styles.mb1}`}>{totalQueries}</h3>
            <p className={`${styles.textSm} ${styles.textGray600}`}>Total Queries</p>
          </div>

          <div className={`${styles.bgWhite} ${styles.rounded2xl} ${styles.p6} ${styles.shadowSm} ${styles.border} ${styles.borderGray100} ${styles.hoverShadowMd} ${styles.transition}`}>
            <div className={`${styles.flex} ${styles.itemsCenter} ${styles.justifyBetween} ${styles.mb2}`}>
              <div className={`${styles.w12} ${styles.h12} ${styles.bgGreen100} ${styles.roundedXl} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter}`}>
                <CheckCircle className={`${styles.w6} ${styles.h6} ${styles.textGreen600}`} />
              </div>
            </div>
            <h3 className={`${styles.text3xl} ${styles.fontBold} ${styles.textGray900} ${styles.mb1}`}>{completedQueries}</h3>
            <p className={`${styles.textSm} ${styles.textGray600}`}>Completed</p>
          </div>

          <div className={`${styles.bgWhite} ${styles.rounded2xl} ${styles.p6} ${styles.shadowSm} ${styles.border} ${styles.borderGray100} ${styles.hoverShadowMd} ${styles.transition}`}>
            <div className={`${styles.flex} ${styles.itemsCenter} ${styles.justifyBetween} ${styles.mb2}`}>
              <div className={`${styles.w12} ${styles.h12} ${styles.bgYellow100} ${styles.roundedXl} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter}`}>
                <Clock className={`${styles.w6} ${styles.h6} ${styles.textYellow600}`} />
              </div>
            </div>
            <h3 className={`${styles.text3xl} ${styles.fontBold} ${styles.textGray900} ${styles.mb1}`}>{pendingQueries}</h3>
            <p className={`${styles.textSm} ${styles.textGray600}`}>Pending</p>
          </div>

          <div className={`${styles.bgWhite} ${styles.rounded2xl} ${styles.p6} ${styles.shadowSm} ${styles.border} ${styles.borderGray100} ${styles.hoverShadowMd} ${styles.transition}`}>
            <div className={`${styles.flex} ${styles.itemsCenter} ${styles.justifyBetween} ${styles.mb2}`}>
              <div className={`${styles.w12} ${styles.h12} ${styles.bgPurple100} ${styles.roundedXl} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter}`}>
                <AlertCircle className={`${styles.w6} ${styles.h6} ${styles.textPurple600}`} />
              </div>
            </div>
            <h3 className={`${styles.text3xl} ${styles.fontBold} ${styles.textGray900} ${styles.mb1}`}>{generalQueries}</h3>
            <p className={`${styles.textSm} ${styles.textGray600}`}>General Inquiries</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`${styles.bgWhite} ${styles.rounded2xl} ${styles.p6} ${styles.shadowSm} ${styles.border} ${styles.borderGray100} ${styles.mb6}`}>
          <div className={`${styles.flex} ${styles.itemsCenter} ${styles.gap3} ${styles.mb4}`}>
            <Filter className={`${styles.w5} ${styles.h5} ${styles.textGray600}`} />
            <h3 className={`${styles.textLg} ${styles.fontSemibold} ${styles.textGray900}`}>Filters</h3>
          </div>
          
          <div className={`${styles.grid} ${styles.gridCols1} ${styles.mdGridCols3} ${styles.gap4}`}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`${styles.px4} ${styles.py2} ${styles.border} ${styles.borderGray300} ${styles.roundedLg} ${styles.focusRing2} ${styles.focusRingBlue500} ${styles.focusBorderTransparent}`}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className={`${styles.px4} ${styles.py2} ${styles.border} ${styles.borderGray300} ${styles.roundedLg} ${styles.focusRing2} ${styles.focusRingBlue500} ${styles.focusBorderTransparent}`}
            >
              <option value="">All Assignments</option>
              <option value="admin">Admin Queries</option>
              <option value="manager">Manager Queries</option>
            </select>

            <input
              type="text"
              placeholder="Filter by city..."
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className={`${styles.px4} ${styles.py2} ${styles.border} ${styles.borderGray300} ${styles.roundedLg} ${styles.focusRing2} ${styles.focusRingBlue500} ${styles.focusBorderTransparent}`}
            />
          </div>
        </div>

        {/* Queries Table */}
        <div className={`${styles.bgWhite} ${styles.rounded2xl} ${styles.shadowSm} ${styles.border} ${styles.borderGray100} ${styles.overflowHidden}`}>
          <div className={`${styles.px6} ${styles.py4} ${styles.borderB} ${styles.borderGray100} ${styles.bgGradientToR} ${styles.fromGray50} ${styles.toBlue50Table}`}>
            <div className={`${styles.flex} ${styles.itemsCenter} ${styles.gap3}`}>
              <Users className={`${styles.w5} ${styles.h5} ${styles.textGray600}`} />
              <h2 className={`${styles.textLg} ${styles.fontSemibold} ${styles.textGray900}`}>All Queries</h2>
            </div>
          </div>

          {error ? (
            <div className={`${styles.p8} ${styles.textCenter}`}>
              <p className={styles.textRed600}>{error}</p>
              <button
                onClick={fetchQueries}
                className={`${styles.mt4} ${styles.px6} ${styles.py2} ${styles.bgBlue600} ${styles.textWhite} ${styles.roundedLg} ${styles.hoverBgBlue700}`}
              >
                Retry
              </button>
            </div>
          ) : queries.length === 0 ? (
            <div className={`${styles.p12} ${styles.textCenter}`}>
              <div className={`${styles.w20} ${styles.h20} ${styles.bgGray100} ${styles.roundedFull} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.mxAuto} ${styles.mb4}`}>
                <MessageSquare className={`${styles.w10} ${styles.h10} ${styles.textGray400}`} />
              </div>
              <h3 className={`${styles.textLg} ${styles.fontSemibold} ${styles.textGray900} ${styles.mb2}`}>No Queries Found</h3>
              <p className={styles.textGray600}>There are no queries matching your filters.</p>
            </div>
          ) : (
            <div className={styles.overflowXAuto}>
              <table className={styles.wFull}>
                <thead className={styles.bgGray50}>
                  <tr>
                    <th className={`${styles.px6} ${styles.py3} ${styles.textLeft} ${styles.textXs} ${styles.fontSemibold} ${styles.textGray700} ${styles.uppercase}`}>User</th>
                    <th className={`${styles.px6} ${styles.py3} ${styles.textLeft} ${styles.textXs} ${styles.fontSemibold} ${styles.textGray700} ${styles.uppercase}`}>Issue</th>
                    <th className={`${styles.px6} ${styles.py3} ${styles.textLeft} ${styles.textXs} ${styles.fontSemibold} ${styles.textGray700} ${styles.uppercase}`}>Location</th>
                    <th className={`${styles.px6} ${styles.py3} ${styles.textLeft} ${styles.textXs} ${styles.fontSemibold} ${styles.textGray700} ${styles.uppercase}`}>Assigned To</th>
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
                          <p className={`${styles.fontMedium} ${styles.textGray900}`}>{query.userId?.name || query.name}</p>
                          <p className={`${styles.textSm} ${styles.textGray500}`}>{query.userId?.email || query.email}</p>
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
                        {query.assignedTo ? (
                          <div>
                            <p className={`${styles.textSm} ${styles.fontMedium} ${styles.textGray900}`}>{query.assignedTo.name}</p>
                            <span className={`${styles.textXs} ${styles.px2} ${styles.py1} ${styles.roundedLg} ${query.assignedRole === 'admin' ? `${styles.bgPurple100} ${styles.textPurple700}` : `${styles.bgBlue100} ${styles.textBlue700}`}`}>
                              {query.assignedRole}
                            </span>
                          </div>
                        ) : (
                          <span className={`${styles.textSm} ${styles.textGray400} ${styles.italic}`}>Unassigned</span>
                        )}
                      </td>
                      <td className={`${styles.px6} ${styles.py4}`}>
                        <span className={`${styles.inlineBlock} ${styles.px3} ${styles.py1} ${styles.roundedFull} ${styles.textXs} ${styles.fontSemibold} ${getStatusClass(query.status)}`}>
                          {query.status}
                        </span>
                      </td>
                      <td className={`${styles.px6} ${styles.py4} ${styles.textSm} ${styles.textGray600}`}>
                        {new Date(query.createdAt).toLocaleDateString()}
                      </td>
                      <td className={`${styles.px6} ${styles.py4}`}>
                        <div className={`${styles.flex} ${styles.flexCol} ${styles.gap2}`}>
                          {query.issue === 'general-inquiry' && query.status !== 'completed' && (
                            <button
                              onClick={() => {
                                setSelectedQuery(query);
                                setShowReplyModal(true);
                              }}
                              className={`${styles.px3} ${styles.py1} ${styles.bgGreen600} ${styles.textWhite} ${styles.textXs} ${styles.roundedLg} ${styles.hoverBgGreen700} ${styles.transition}`}
                            >
                              Respond
                            </button>
                          )}
                          
                          {(query.assignedRole === 'manager' || query.assignedRole === 'admin') && (
                            <select
                              onChange={(e) => reassignQuery(query._id, e.target.value)}
                              className={`${styles.px2} ${styles.py1} ${styles.textXs} ${styles.border} ${styles.borderGray300} ${styles.roundedLg}`}
                              defaultValue=""
                            >
                              <option value="" disabled>Reassign...</option>
                              {managers.map((mgr) => (
                                <option key={mgr._id} value={mgr._id}>
                                  {mgr.name}
                                </option>
                              ))}
                            </select>
                          )}

                          {query.reply && (
                            <button
                              onClick={() => alert(`Reply: ${query.reply}`)}
                              className={`${styles.px3} ${styles.py1} ${styles.bgBlue100} ${styles.textBlue700} ${styles.textXs} ${styles.roundedLg} ${styles.hoverBgBlue200} ${styles.transition}`}
                            >
                              View Reply
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
            <h3 className={`${styles.textXl} ${styles.fontBold} ${styles.textGray900} ${styles.mb4}`}>Respond to General Inquiry</h3>
            
            <div className={`${styles.mb4} ${styles.p4} ${styles.bgGray50} ${styles.roundedLg}`}>
              <p className={`${styles.textSm} ${styles.textGray600} ${styles.mb1}`}>User: <span className={`${styles.fontMedium} ${styles.textGray900}`}>{selectedQuery?.userId?.name || selectedQuery?.name}</span></p>
              <p className={`${styles.textSm} ${styles.textGray600} ${styles.mb2}`}>Email: <span className={`${styles.fontMedium} ${styles.textGray900}`}>{selectedQuery?.userId?.email || selectedQuery?.email}</span></p>
              <p className={`${styles.textSm} ${styles.textGray600}`}>Query: <span className={styles.textGray700}>{selectedQuery?.comments}</span></p>
            </div>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response here..."
              className={`${styles.wFull} ${styles.h32} ${styles.px4} ${styles.py3} ${styles.border} ${styles.borderGray300} ${styles.roundedLg} ${styles.focusRing2} ${styles.focusRingBlue500} ${styles.focusBorderTransparent} ${styles.resizeNone}`}
            />

            <div className={`${styles.flex} ${styles.gap3} ${styles.mt4}`}>
              <button
                onClick={respondToQuery}
                className={`${styles.flex1} ${styles.px6} ${styles.py3} ${styles.bgBlue600} ${styles.textWhite} ${styles.roundedLg} ${styles.hoverBgBlue700} ${styles.transition} ${styles.fontMedium}`}
              >
                Send Response
              </button>
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyText('');
                  setSelectedQuery(null);
                }}
                className={`${styles.px6} ${styles.py3} ${styles.bgGray200Btn} ${styles.textGray700} ${styles.roundedLg} ${styles.hoverBgGray300} ${styles.transition} ${styles.fontMedium}`}
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