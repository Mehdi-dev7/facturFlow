import { 
  Navbar, 
  HeroSection, 
  FeaturesSection, 
  SecurePaymentsSection,
  HowItWorksSection,
  ProblemSolutionSection,
  PricingSection
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
    </>
  )
}
