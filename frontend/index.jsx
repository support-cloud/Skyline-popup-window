import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cloudLogo from 'asset/image/cloud-logo.svg';
import { getPath } from 'utils/route-map';
import classnames from 'classnames';
import GlobalNav from '../GlobalNav';
import ProjectDropdown from './ProjectDropdown';
import RightContent from './RightContent';
import styles from './index.less';

const TrialPopup = ({ onDaysUpdate, onTrialEndedUpdate }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [trialEnded, setTrialEnded] = useState(false);
  const [daysLeft, setDaysLeft] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrialData = async () => {
    try {
      const storedData = sessionStorage.getItem('userLoginTime');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.login_time) {
          const startDate = new Date(data.login_time * 1000);
          const currentDate = new Date();
          const daysPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
          const remainingDays = Math.max(30 - (daysPassed + 1), 0);

          const sessionClosed = sessionStorage.getItem('trialPopupClosed');
          const shouldShow = remainingDays > 0
            ? sessionClosed !== 'true'
            : true;

          setTrialEnded(remainingDays <= 0);
          setDaysLeft(remainingDays);
          setShowPopup(shouldShow);
          onDaysUpdate(remainingDays);
          onTrialEndedUpdate(remainingDays <= 0);
          return; 
        }
      }
      const response = await fetch('/api/openstack/skyline/api/v1/user-login-time');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!data.login_time) return;
      sessionStorage.setItem('userLoginTime', JSON.stringify(data));

      const startDate = new Date(data.login_time * 1000);
      const currentDate = new Date();
      const daysPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(30 - (daysPassed + 1), 0);

      const sessionClosed = sessionStorage.getItem('trialPopupClosed');
      const shouldShow = remainingDays > 0
        ? sessionClosed !== 'true'
        : true; 

      setTrialEnded(remainingDays <= 0);
      setDaysLeft(remainingDays);
      setShowPopup(shouldShow);
      onDaysUpdate(remainingDays);
      onTrialEndedUpdate(remainingDays <= 0);
    } catch (error) {
      console.error('Error fetching trial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchTrialData();
    };
    fetchData();
  }, []);

  const setTrialPopupClosed = () => {
    sessionStorage.setItem('trialPopupClosed', 'true');
  };

  const handleAgreeAndContinue = () => {
    if (trialEnded) return; 
    setShowPopup(false);
    setTrialPopupClosed();
  };

  if (isLoading) return <div>Loading...</div>;

  return showPopup ? (
    <div className="trial-popup-overlay">
      <div className="trial-popup">
        <div className="trial-popup-icons">
          <div className="icon-cloud">☁️</div>
          <div className="icon-circle">
            <div className="icon-x">✕</div>
          </div>
          <div className="icon-server">🖥️</div>
        </div>

        {trialEnded ? (
          <>
            <h2 className="popup-title">Your 30-day trial has ended</h2>
            <p className="popup-text">
              You can keep using our most powerful features like Timeline and
              Custom Fields. Select a plan, add your billing info, and you're
              all set!
            </p>
            <button
              className="agree-continue-btn"
              onClick={() => window.location.href = '/billing'}
            >
              Upgrade Now
            </button>
          </>
        ) : (
          <>
            <h2 className="popup-title">Your 30-day trial has started</h2>
            <p className="popup-text">
              You have access to our most powerful features like Timeline and
              Custom Fields. There are {daysLeft} days left in your trial
              period.
            </p>
            <button
              className="agree-continue-btn"
              onClick={handleAgreeAndContinue}
            >
              Agree & continue
            </button>
          </>
        )}
      </div>
    </div>
  ) : null;
};

const trialPopupStyles = `
.trial-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.trial-popup {
  background-color: white;
  padding: 25px;
  border-radius: 10px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
}

.trial-popup-icons {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
}

.icon-cloud, .icon-server {
  font-size: 24px;
  margin: 0 25px;
}

.icon-circle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 3px solid #f6aeae;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon-x {
  background-color: #f6aeae;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  color: white;
}

.popup-title {
  margin: 10px 0;
  font-size: 20px;
  color: #333;
}

.popup-text {
  margin: 10px 0;
  font-size: 14px;
  color: #555;
  line-height: 1.4;
}

.agree-continue-btn {
  background-color: #4f7dfd;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  margin-top: 15px;
  cursor: pointer;
  font-weight: bold;
}

.agree-continue-btn:hover {
  background-color: #3a68e0;
}

.trialBanner, .trialEndedBanner {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  padding: 8px 32px;
  border-radius: 0 0 8px 8px;
  z-index: 100;
  font-weight: 510;
  color: #4361ee
}

.trialBanner {
  background-color: #fff;
}

.trialEndedBanner {
  background-color: #fff;
  color: #e52c2c;
}

@media (max-width: 600px) {
  .trial-popup {
    width: 95%;
    padding: 15px;
  }

  .trial-popup-icons {
    margin-bottom: 10px;
  }

  .icon-cloud, .icon-server {
    font-size: 20px;
    margin: 0 15px;
  }

  .icon-circle {
    width: 50px;
    height: 50px;
  }

  .icon-x {
    width: 25px;
    height: 25px;
    font-size: 14px;
  }

  .popup-title {
    font-size: 18px;
  }

  .popup-text {
    font-size: 12px;
  }

  .agree-continue-btn {
    padding: 8px 16px;
    font-size: 14px;
  }
}
`;

export default function HeaderContent(props) {
  const { isAdminPage = false, navItems = [] } = props;
  const [remainingDays, setRemainingDays] = useState(null);
  const [trialEnded, setTrialEnded] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const getRouteName = (routeName) =>
    isAdminPage ? `${routeName}Admin` : routeName;

  const getRoutePath = (routeName, params = {}, query = {}) => {
    const realName = getRouteName(routeName);
    return getPath({ key: realName, params, query });
  };

  const renderLogo = () => {
    const homeUrl = getRoutePath('overview');
    return (
      <div className={classnames(styles.logo)}>
        <Link to={homeUrl}>
          <img src={cloudLogo} alt="logo" className={styles['logo-image']} />
        </Link>
      </div>
    );
  };
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = trialPopupStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleDaysUpdate = (days) => {
    setRemainingDays(days);
  };

  const handleTrialEndedUpdate = (ended) => {
    setTrialEnded(ended);
  };

  return (
    <>
      <div className={styles.header}>
        {showBanner && !trialEnded && remainingDays > 0 && (
          <div className="trialBanner">
            <div className="trialText">
              🚀 {remainingDays} days left in your 30-day free trial. Upgrade now!
            </div>
          </div>
        )}
        {showBanner && trialEnded && (
          <div className="trialEndedBanner">
            <div className="trialEndedText">
              ⚠️ Your 30-day trial has ended. Please upgrade to continue using the service.
            </div>
          </div>
        )}

        <GlobalNav navItems={navItems} />
        {renderLogo()}
        {!isAdminPage && <ProjectDropdown />}
        <RightContent {...props} remainingDays={remainingDays} />
      </div>
      <TrialPopup
        onDaysUpdate={handleDaysUpdate}
        onTrialEndedUpdate={handleTrialEndedUpdate}
      />
    </>
  );
}
