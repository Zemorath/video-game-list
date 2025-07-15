import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const LoginSchema = Yup.object().shape({
  usernameOrEmail: Yup.string()
    .required('Username or email is required')
    .min(3, 'Must be at least 3 characters'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

const Login = () => {
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    setIsLoading(true);
    setApiError('');

    try {
      const response = await authAPI.login({
        username_or_email: values.usernameOrEmail,
        password: values.password,
      });

      if (response.success) {
        login(response.user);
        navigate('/');
      } else {
        setApiError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.data?.errors) {
        // Handle field-specific errors
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(field => {
          setFieldError(field, errors[field][0]);
        });
      } else {
        setApiError(
          error.response?.data?.message || 
          'Login failed. Please check your credentials.'
        );
      }
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-20 -ml-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link 
              to="/register" 
              className="font-medium text-accent-primary hover:text-accent-secondary transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>

        <Formik
          initialValues={{
            usernameOrEmail: '',
            password: '',
          }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="usernameOrEmail" className="sr-only">
                    Username or Email
                  </label>
                  <Field
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    type="text"
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-dark-accent bg-dark-secondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                    placeholder="Username or Email"
                  />
                  <ErrorMessage 
                    name="usernameOrEmail" 
                    component="div" 
                    className="mt-1 text-sm text-red-400" 
                  />
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-dark-accent bg-dark-secondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                    placeholder="Password"
                  />
                  <ErrorMessage 
                    name="password" 
                    component="div" 
                    className="mt-1 text-sm text-red-400" 
                  />
                </div>
              </div>

              {apiError && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                  {apiError}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-accent-primary hover:bg-accent-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-gray-400 hover:text-accent-primary transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Login;
