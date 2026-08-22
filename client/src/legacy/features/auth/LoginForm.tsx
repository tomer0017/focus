import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button, Card, Form as BSForm } from "react-bootstrap";
import { useAuthStore } from "../../stores/authStore";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

const LoginForm = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  const initialValues = {
    username: "",
    password: "",
  };

  const validationSchema = Yup.object({
    username: Yup.string().required("שדה חובה"),
    password: Yup.string().required("שדה חובה"),
  });

  const handleSubmit = async (values: typeof initialValues) => {
    try {
      const user = await authService.login(values); // מחזיר גם token
      setUser(user); // שמירה בזיכרון וב-localStorage
      navigate("/dashboard"); // או לאן שתרצה
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card>
      <Card.Body>
        <h3 className="mb-4 text-center">התחברות</h3>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form>
              <BSForm.Group className="mb-3">
                <BSForm.Label>שם משתמש</BSForm.Label>
                <Field name="username" className="form-control" />
                <div className="text-danger small">
                  <ErrorMessage name="username" />
                </div>
              </BSForm.Group>

              <BSForm.Group className="mb-3">
                <BSForm.Label>סיסמה</BSForm.Label>
                <Field name="password" type="password" className="form-control" />
                <div className="text-danger small">
                  <ErrorMessage name="password" />
                </div>
              </BSForm.Group>

              <Button type="submit" variant="primary" className="w-100">
                התחבר
              </Button>
            </Form>
          )}
        </Formik>
      </Card.Body>
    </Card>
  );
};

export default LoginForm;
