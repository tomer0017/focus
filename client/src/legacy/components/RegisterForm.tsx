import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { authService } from "../services/authService";

const RegisterForm = () => {
  const initialValues = { username: "", password: "" };

  const validationSchema = Yup.object({
    username: Yup.string().required("Required"),
    password: Yup.string().min(4).required("Required"),
  });

  const onSubmit = async (values: typeof initialValues) => {
    try {
      const res = await authService.register(values);
      console.log("User created:", res.data);
      alert("משתמש נרשם בהצלחה");
    } catch (err: any) {
      alert(err.response?.data?.message || "שגיאה");
    }
  };

  return (
    <div className="container mt-5">
      <h2>הרשמה</h2>
      <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
        {({ errors, touched }) => (
          <Form>
            <div className="mb-3">
              <label>שם משתמש</label>
              <Field name="username" className="form-control" />
              {touched.username && errors.username && <div className="text-danger">{errors.username}</div>}
            </div>
            <div className="mb-3">
              <label>סיסמה</label>
              <Field name="password" type="password" className="form-control" />
              {touched.password && errors.password && <div className="text-danger">{errors.password}</div>}
            </div>
            <button type="submit" className="btn btn-primary">הרשמה</button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default RegisterForm;
