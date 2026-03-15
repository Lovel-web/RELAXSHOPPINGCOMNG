import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Clock, Shield, Truck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';

const Home = () => {
  const features = [
    {
      icon: Clock,
      title: 'Scheduled Delivery',
      description: 'Choose your preferred time slot - 10 AM, 1 PM, or 4 PM',
    },
    {
      icon: ShoppingBag,
      title: 'Fresh Products',
      description: 'Quality groceries from trusted local vendors',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing with Paystack',
    },
    {
      icon: Truck,
      title: 'Estate Delivery',
      description: 'Convenient delivery direct to your estate or hotel',
    },
  ];

  const timeline = [
    { step: 1, title: 'Order', description: 'Browse and add items to cart' },
    { step: 2, title: 'Batch', description: 'Your order joins the next batch' },
    { step: 3, title: 'Delivery', description: 'Receive at your scheduled time' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero Section - Calm, spacious design */}
        <section className="relative py-24 md:py-36 overflow-hidden">
          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="mx-auto max-w-3xl text-center"
            >
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-sm uppercase tracking-widest text-muted-foreground mb-6"
              >
                Nigeria's Calm Shopping Experience
              </motion.p>
              
              <h1 className="text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl mb-6 text-foreground">
                Scheduled delivery.
                <br />
                <span className="text-primary">Calm shopping.</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
                Order groceries without the rush. We deliver in organized batches at times that work for you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 hover-calm px-8">
                  <Link to="/shops">
                    Shop as Customer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="hover-calm">
                  <Link to="/auth/signup">Join as Partner</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-20 bg-accent/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-medium mb-4">How It Works</h2>
              <p className="text-muted-foreground">Simple, organized, stress-free</p>
            </motion.div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-4 max-w-3xl mx-auto">
              {timeline.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex flex-col items-center text-center flex-1"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-medium mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-medium mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  
                  {index < timeline.length - 1 && (
                    <div className="hidden md:block absolute">
                      <ArrowRight className="h-5 w-5 text-border mt-6 ml-32" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-medium mb-4">Why RelaxShopping?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We prioritize order, predictability, and trust over speed
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  className="card-calm p-6 hover-calm"
                >
                  <div className="inline-flex p-3 rounded-lg bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Partner CTA Section */}
        <section className="py-20 bg-accent/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="text-2xl md:text-3xl font-medium mb-4">
                Join Our Network
              </h2>
              <p className="text-muted-foreground mb-8">
                Whether you're a vendor looking to sell, or want to join our delivery team
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline" className="hover-calm">
                  <Link to="/auth/signup">Become a Vendor</Link>
                </Button>
                <Button asChild variant="outline" className="hover-calm">
                  <Link to="/auth/signup">Join as Staff</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-primary text-primary-foreground rounded-2xl p-12 text-center"
            >
              <h2 className="text-2xl md:text-3xl font-medium mb-4">
                Ready for Calm Shopping?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                Join thousands of customers enjoying organized grocery delivery across Nigeria
              </p>
              <Button asChild size="lg" variant="secondary" className="hover-calm">
                <Link to="/auth/signup">Get Started Today</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Home;
