'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      router.push('/dashboard');
    } else {
      setError('Email ou mot de passe incorrect');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#e8ecef]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col lg:flex-row">
        <div className="relative hidden overflow-hidden lg:flex lg:w-[56%] xl:w-[58%]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f1f5f8] via-[#edf3f7] to-[#e4edf3]" />
          <div className="absolute -top-28 -right-20 h-[360px] w-[360px] rounded-[90px] bg-[#00abec]/90" />
          <div className="absolute -bottom-24 -left-16 h-[260px] w-[260px] rounded-[72px] bg-[#1c325d]" />
          <div className="absolute right-16 bottom-24 h-24 w-24 rounded-full bg-[#00abec]" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <Image
                  src="/sos-icons/logo-text.png"
                  alt="SOS Villages d'Enfants Tunisie"
                  width={200}
                  height={72}
                  className="h-auto w-[200px]"
                  priority
                />
                <div className="flex items-center gap-3">
                  <Image
                    src="/sos-icons/family-3.png"
                    alt="Famille SOS"
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] opacity-95"
                  />
                  <Image
                    src="/sos-icons/hand.png"
                    alt="Protection"
                    width={58}
                    height={58}
                    className="h-[58px] w-[58px] opacity-95"
                  />
                </div>
              </div>

              <div className="grid max-w-[220px] grid-cols-4 gap-3">
                {['#84ccf1', '#00abec', '#b8ddf4', '#de5a6c', '#eba9a9', '#f1c9c6', '#1c325d', '#00abec'].map(
                  (color, index) => (
                    <span
                      key={`${color}-${index}`}
                      className="h-6 w-6 rounded-full border border-white/60 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  )
                )}
              </div>

              <div className="max-w-[580px] space-y-5">
                <h1 className="text-4xl font-bold leading-tight text-[#1c325d] xl:text-[48px]">
                  Un accueil familial et professionnel pour chaque enfant.
                </h1>
                <p className="max-w-[500px] text-base leading-relaxed text-[#51647f] xl:text-lg">
                  Plateforme de gestion SOS Villages d&apos;Enfants Tunisie. Suivez les dossiers, coordonnez les
                  interventions et securisez le parcours de chaque enfant.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 rounded-3xl bg-white/85 p-5 shadow-lg shadow-[#1c325d]/10 backdrop-blur-sm">
              <div>
                <p className="text-3xl font-bold text-[#00abec]">4</p>
                <p className="mt-1 text-sm font-medium text-[#51647f]">Villages SOS</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#00abec]">450+</p>
                <p className="mt-1 text-sm font-medium text-[#51647f]">Enfants suivis</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#00abec]">50+</p>
                <p className="mt-1 text-sm font-medium text-[#51647f]">Annees d&apos;action</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6 md:p-10">
          <div className="absolute right-[-90px] top-[-90px] h-[230px] w-[230px] rounded-[60px] bg-[#00abec]/18" />
          <div className="absolute bottom-[-80px] left-[-60px] h-[200px] w-[200px] rounded-[52px] bg-[#00abec]/12" />

          <div className="relative z-10 w-full max-w-[460px] animate-fade-in-up">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Image
                src="/sos-icons/logo-text.png"
                alt="SOS Villages d'Enfants Tunisie"
                width={170}
                height={64}
                className="h-auto w-[170px]"
                priority
              />
              <Image
                src="/sos-icons/hand.png"
                alt="Protection de l'enfance"
                width={58}
                height={58}
                className="h-[58px] w-[58px]"
              />
            </div>

            <div className="mb-6 hidden lg:block">
              <div className="inline-flex flex-col gap-1 rounded-t-[22px] bg-[#00abec] px-6 py-4 text-white shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Portail interne</p>
                <h2 className="text-3xl font-bold text-white">Connexion</h2>
                <p className="text-sm text-white/90">Accedez a votre espace de travail securise.</p>
              </div>
            </div>

            <Card className="overflow-hidden rounded-[28px] border border-[#cde8f8] bg-white/92 shadow-2xl shadow-[#1c325d]/10">
              <div className="h-2 bg-gradient-to-r from-[#00abec] via-[#84ccf1] to-[#de5a6c]" />

              <form onSubmit={handleSubmit}>
                <CardHeader className="pb-5 pt-6">
                  <CardTitle className="text-2xl text-[#1c325d]">Bienvenue</CardTitle>
                  <CardDescription className="text-sm text-[#6a7e9a]">
                    Entrez vos identifiants pour continuer.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-[#f9e5e4] p-3 text-sm font-medium text-[#de5a6c]">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-[#1c325d]">
                      Email professionnel
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="prenom.nom@sosvillages.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 rounded-xl border-[#cde8f8] bg-[#f8fcff] px-4 focus:border-[#00abec]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-semibold text-[#1c325d]">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 rounded-xl border-[#cde8f8] bg-[#f8fcff] px-4 pr-11 focus:border-[#00abec]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78849e] transition-colors hover:text-[#1c325d]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#cde8f8] text-[#00abec] focus:ring-[#00abec]"
                      />
                      <span className="text-sm text-[#5f7290]">Se souvenir de moi</span>
                    </label>
                    <a href="#" className="text-sm font-semibold text-[#00abec] transition-colors hover:text-[#1c325d]">
                      Mot de passe oublie ?
                    </a>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 pb-6">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-[#00abec] text-base font-semibold shadow-lg shadow-[#00abec]/30 hover:bg-[#0096d2]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      'Se connecter'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card className="mt-5 rounded-2xl border border-[#cde8f8] bg-white/70 shadow-lg shadow-[#1c325d]/5 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-sm font-semibold text-[#1c325d]">Comptes de test</CardTitle>
                <CardDescription className="text-xs text-[#5f7290]">
                  Utilisez les comptes seed de ton backend.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 text-xs text-[#6a7e9a] space-y-1">
                <div>decl1@sos.tn</div>
                <div>psy1@sos.tn</div>
                <div>dir.tunis@sos.tn</div>
                <div>resp.sauvegarde@sos.tn</div>
                <div>admin.it@sos.tn</div>
                <div className="pt-1 font-semibold text-[#1c325d]">Mot de passe: password123</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
