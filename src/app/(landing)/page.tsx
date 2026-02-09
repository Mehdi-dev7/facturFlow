import { 
  Navbar, 
  HeroSection, 
  FeaturesSection, 
  SecurePaymentsSection,
  HowItWorksSection,
  ProblemSolutionSection,
  PricingSection,
  FaqSection,
  Footer
} from "@/components/landing"

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <SecurePaymentsSection />
      <HowItWorksSection />
      <ProblemSolutionSection />
      <PricingSection />
      <FaqSection />
      <Footer />
    </>
  )
}
