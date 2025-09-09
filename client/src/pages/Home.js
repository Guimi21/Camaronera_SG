import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirigir automáticamente al módulo principal según el tipo de usuario
      switch (user.tipo_usuario) {
        case "Administrador":
          navigate("/administrador");
          break;
        case "Digitador":
          navigate("/digitador");
          break;
        case "Directivo":
          navigate("/directivo");
          break;
        default:
          navigate("/body");
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="p-8 text-center">
      <h2 className="text-3xl font-bold mb-4">Bienvenido a la Camaronera</h2>
      <p className="text-lg text-gray-600 mb-6">
        Aquí gestionamos cosechas, piscinas y producción de camarón 🦐
      </p>
    </div>
  );
}
