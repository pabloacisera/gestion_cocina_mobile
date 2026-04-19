import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export function BackButton() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(-1)} className="btn-back">
      <FontAwesomeIcon icon={faArrowLeft} /> Volver
    </button>
  );
}