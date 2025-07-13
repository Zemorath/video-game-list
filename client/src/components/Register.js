import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/\d/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password'), null], 'Passwords must match'),
  firstName: Yup.string()
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  lastName: Yup.string()
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
});

const Register = () => {
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    setIsLoading(true);
    setApiError('');

    try {
      const response = await authAPI.register({
        username: values.username,
        email: values.email,
        password: values.password,
        confirm_password: values.confirmPassword,
        first_name: values.firstName || null,
        last_name: values.lastName || null,
      });

      if (response.success) {
        login(response.access_token, response.user);
        navigate('/');
      } else {
        setApiError(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.errors) {
        // Handle field-specific errors
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(field => {
          if (Array.isArray(errors[field])) {
            setFieldError(field, errors[field][0]);
          } else {
            setFieldError(field, errors[field]);
          }
        });
      } else {
        setApiError(
          error.response?.data?.message || 
          'Registration failed. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link 
              to="/login" 
              className="font-medium text-accent-primary hover:text-accent-secondary transition-colors"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Formik
          initialValues={{
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values }) => (
            <Form className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="sr-only">
                      First Name
                    </label>
                    <Field
                      id="firstName"
                      name="firstName"
                      type="text"
                      className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-dark-accent bg-dark-secondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                      placeholder="First Name (optional)"
                    />
                    <ErrorMessage 
                      name="firstName" 
                      component="div" 
                      className="mt-1 text-sm text-red-400" 
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="sr-only">
                      Last Name
                    </label>
                    <Field
                      id="lastName"
                      name="lastName"
                      type="text"
                      className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-dark-accent bg-dark-secondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                      placeholder="Last Name (optional)"
                    />
                    <ErrorMessage 
                      name="lastName" 
                      component="div" 
                      className="mt-1 text-sm text-red-400" 
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="sr-only">
                    Username
                  </label>
                  <Field
                    id="username"
                    name="username"
                    type="text"
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-dark-accent bg-dark-secondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                    placeholder="Username"
                  />
                  <ErrorMessage 
                    name="username" 
                    component="div" 
                    className="mt-1 text-sm text-red-400" 
                  />
                </div>

                <div>
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-dark-accent bg-dark-secondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                    placeholder="Email address"
                  />
                  <ErrorMessage 
                    name="email" 
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
                  
                  {/* Password strength indicator */}
                  {values.password && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-gray-400">Password requirements:</div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className={`${values.password.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                          ✓ 8+ characters
                        </div>
                        <div className={`${/[A-Z]/.test(values.password) ? 'text-green-400' : 'text-gray-400'}`}>
                          ✓ Uppercase
                        </div>
                        <div className={`${/[a-z]/.test(values.password) ? 'text-green-400' : 'text-gray-400'}`}>
                          ✓ Lowercase
                        </div>
                        <div className={`${/\d/.test(values.password) ? 'text-green-400' : 'text-gray-400'}`}>
                          ✓ Number
                        </div>
                        <div className={`${/[!@#$%^&*(),.?":{}|<>]/.test(values.password) ? 'text-green-400' : 'text-gray-400'} col-span-2`}>
                          ✓ Special character
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    Confirm Password
                  </label>
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-dark-accent bg-dark-secondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                    placeholder="Confirm Password"
                  />
                  <ErrorMessage 
                    name="confirmPassword" 
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
                      Creating account...
                    </div>
                  ) : (
                    'Create account'
                  )}
                </button>
              </div>

              <div className="text-xs text-gray-400 text-center">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Register;
