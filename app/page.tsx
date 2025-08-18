'use client'

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spin, Typography, Button, Card, Row, Col } from 'antd';
import { 
  ClockCircleOutlined, 
  TeamOutlined, 
  EnvironmentOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  StarOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import Navbar from '../components/ui/navbar';

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-blue-100 rounded-xl mx-auto mb-4"></div>
          <div className="w-32 h-4 bg-gray-100 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center animate-fade-in">
          <Spin size="large" />
          <div className="mt-4">
            <Text className="text-gray-600">Loading HealthShift...</Text>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-green-600">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative z-10 px-6 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div className="text-white animate-slide-in-left">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm hover-lift">
                    <ClockCircleOutlined className="text-2xl text-white" />
                  </div>
                  <Text className="text-white/90 text-lg font-medium">HealthShift</Text>
                </div>
                
                <Title level={1} className="!text-white !mb-6 !text-4xl lg:!text-6xl font-bold leading-tight">
                  Smart Healthcare
                  <br />
                  <span className="text-green-300 animate-fade-in">Staff Management</span>
                </Title>
                
                <Paragraph className="!text-white/90 !text-xl !mb-8 leading-relaxed max-w-lg">
                  Streamline your healthcare facility with location-based clock-in/out, 
                  real-time staff tracking, and comprehensive analytics. Built for modern healthcare teams.
                </Paragraph>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link href="/api/auth/login?screen_hint=signup">
                    <Button
                      size="large" 
                      className="premium-button-primary !bg-white !text-blue-600 !border-white hover:!bg-gray-100 !font-semibold !h-14 !px-8 !rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover-lift"
                      icon={<ArrowRightOutlined className="w-5 h-5 ml-2" />}
                    >
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/api/auth/login">
                    <Button 
                      size="large" 
                      className="premium-button-primary !text-white !border-white/30 hover:!bg-white/10 !font-semibold !h-14 !px-8 !rounded-xl backdrop-blur-sm transition-all duration-300 hover-lift"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center space-x-6 text-white/80">
                  <div className="flex items-center">
                    <SafetyOutlined className="mr-2 w-4 h-4" />
                    <Text className="text-white/80">Trusted</Text>
                  </div>
                  <div className="flex items-center">
                    <SafetyOutlined className="mr-2 w-4 h-4" />
                    <Text className="text-white/80">Secure & Reliable</Text>
                  </div>
                  <div className="flex items-center">
                    <GlobalOutlined className="mr-2 w-4 h-4" />
                    <Text className="text-white/80">Global Scale</Text>
                  </div>
                </div>
              </div>

              {/* Right Column - Hero Image/Illustration */}
              <div className="relative animate-slide-in-right">
                <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover-lift">
                  <div className="space-y-6">
                    {/* Mock Dashboard Preview */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl animate-scale-in">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                            <TeamOutlined className="text-blue-600" />
                          </div>
                          <div>
                            <Text strong className="text-gray-800">Sarah Johnson</Text>
                            <br />
                            <Text className="text-gray-500 text-sm">Nurse Manager</Text>
                          </div>
                        </div>
                        <div className="status-online w-3 h-3 rounded-full"></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4 hover-lift">
                          <Text className="text-blue-600 font-semibold">8.5h</Text>
                          <br />
                          <Text className="text-gray-600 text-sm">Today</Text>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 hover-lift">
                          <Text className="text-green-600 font-semibold">12</Text>
                          <br />
                          <Text className="text-gray-600 text-sm">Staff Online</Text>
                        </div>
                      </div>
                    </div>
                    
                    {/* Location indicator */}
                    <div className="bg-white/90 rounded-xl p-4 flex items-center animate-scale-in">
                      <EnvironmentOutlined className="text-green-500 text-xl mr-3" />
                      <div>
                        <Text strong className="text-gray-800">Work Area</Text>
                        <br />
                        <Text className="text-gray-500 text-sm">Main Hospital Campus</Text>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-green-400 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Staff Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools designed specifically for healthcare facilities to manage staff efficiently and securely.
            </p>
          </div>

          <Row gutter={[32, 32]} className="mb-16">
            <Col xs={24} md={8}>
              <div className="premium-card p-8 h-full hover-lift animate-slide-in-left">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 hover-lift">
                    <ClockCircleOutlined className="text-3xl text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Smart Clock In/Out</h4>
                  <p className="text-gray-600 mb-6">
                    Location-based clock-in system with geofencing ensures staff can only clock in from designated work areas.
                  </p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircleOutlined className="text-green-500 mr-2 w-4 h-4" />
                      GPS location verification
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircleOutlined className="text-green-500 mr-2 w-4 h-4" />
                      Customizable work perimeters
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircleOutlined className="text-green-500 mr-2 w-4 h-4" />
                      Automated time tracking
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col xs={24} md={8}>
              <div className="premium-card p-8 h-full hover-lift animate-scale-in">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 hover-lift">
                    <TeamOutlined className="text-3xl text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Real-time Tracking</h4>
                  <p className="text-gray-600 mb-6">
                    Monitor staff activity, view shift history, and track working hours with comprehensive real-time dashboards.
                  </p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircleOutlined className="text-green-500 mr-2 w-4 h-4" />
                      Live staff status monitoring
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircleOutlined className="text-green-500 mr-2 w-4 h-4" />
                      Detailed shift analytics
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircleOutlined className="text-green-500 mr-2 w-4 h-4" />
                      Automated reporting
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col xs={24} md={8}>
              <div className="premium-card p-8 h-full hover-lift animate-slide-in-right">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 hover-lift">
                    <EnvironmentOutlined className="text-3xl text-purple-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Location Management</h4>
                  <p className="text-gray-600 mb-6">
                    Set custom work perimeters with Google Maps integration and precise radius controls for multiple locations.
                  </p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircleOutlined className="text-green-500 mr-2 w-4 h-4" />
                      Google Maps integration
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircleOutlined className="text-green-500 mr-2 w-4 h-4" />
                      Multiple location support
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircleOutlined className="text-green-500 mr-2 w-4 h-4" />
                      Flexible radius settings
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Stats Section */}
          <div className="premium-card p-12 animate-scale-in hover-lift">
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} lg={12}>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Trusted by Healthcare Professionals
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Join thousands of healthcare facilities that have streamlined their staff management with HealthShift.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
                    <Text className="text-gray-600">Uptime Reliability</Text>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
                    <Text className="text-gray-600">Healthcare Facilities</Text>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-purple-600 mb-2">50K+</div>
                    <Text className="text-gray-600">Active Users</Text>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
                    <Text className="text-gray-600">Support Available</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl p-8 hover-lift">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="flex -space-x-2 mr-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-full border-2 border-white"></div>
                          <div className="w-10 h-10 bg-green-500 rounded-full border-2 border-white"></div>
                          <div className="w-10 h-10 bg-purple-500 rounded-full border-2 border-white"></div>
                          <div className="w-10 h-10 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Text className="text-white text-xs font-bold">+</Text>
                          </div>
                        </div>
                        <div>
                          <Text strong className="text-gray-800">Healthcare Teams</Text>
                          <br />
                          <Text className="text-gray-600 text-sm">Using HealthShift Daily</Text>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white rounded-xl p-4 hover-lift">
                        <div className="flex items-center">
                          <StarOutlined className="text-yellow-500 mr-2 w-5 h-5" />
                          <Text strong>4.9/5 Rating</Text>
                        </div>
                        <Text className="text-gray-500">Based on 1,200+ reviews</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h2 className="text-white text-4xl font-bold mb-6">
            Ready to Transform Your Staff Management?
          </h2>
          <p className="text-white/90 text-xl mb-8 max-w-2xl mx-auto">
            Join healthcare facilities worldwide who trust HealthShift for their staff management needs. 
            Get started in minutes with our easy setup process.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/api/auth/login?screen_hint=signup">
              <Button 
                size="large" 
                className="premium-button-primary !bg-white !text-blue-600 !border-white hover:!bg-gray-100 !font-semibold !h-14 !px-8 !rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover-lift"
                icon={<ThunderboltOutlined className="w-5 h-5 mr-2" />}
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/api/auth/login">
              <Button 
                size="large" 
                className="premium-button-primary !text-white !border-white/30 hover:!bg-white/10 !font-semibold !h-14 !px-8 !rounded-xl backdrop-blur-sm transition-all duration-300 hover-lift"
              >
                Sign In to Your Account
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-white/80">
            <div className="flex items-center">
              <CheckCircleOutlined className="mr-2 w-4 h-4" />
              <Text className="text-white/80">No credit card required</Text>
            </div>
            <div className="flex items-center">
              <CheckCircleOutlined className="mr-2 w-4 h-4" />
              <Text className="text-white/80">Setup in under 5 minutes</Text>
            </div>
            <div className="flex items-center">
              <CheckCircleOutlined className="mr-2 w-4 h-4" />
              <Text className="text-white/80">24/7 support included</Text>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-4 pb-4 px-6">
        {/* <div className="max-w-7xl mx-auto"> */}
          {/* <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <ClockCircleOutlined className="text-2xl text-blue-400 mr-2" />
                <span className="text-white text-xl font-bold">HealthShift</span>
              </div>
              <p className="text-gray-400">
                Smart healthcare staff management for modern facilities.
              </p>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-4">Product</h5>
              <div className="space-y-2">
                <div><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Features</Link></div>
                <div><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Pricing</Link></div>
                <div><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Security</Link></div>
              </div>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-4">Support</h5>
              <div className="space-y-2">
                <div><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Documentation</Link></div>
                <div><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Help Center</Link></div>
                <div><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Contact Us</Link></div>
              </div>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-4">Company</h5>
              <div className="space-y-2">
                <div><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">About</Link></div>
                <div><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy</Link></div>
                <div><Link href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Terms</Link></div>
              </div>
            </div>
          </div> */}
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 HealthShift. All rights reserved. Built for healthcare professionals.
            </p>
          </div>
        {/* </div> */}
      </footer>
    </div>
  );
}