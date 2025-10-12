// Portal UNK - Main Index/Home Page

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Users, Calendar, Star, ArrowRight } from "lucide-react";
import unkLogo from "@/assets/unk-logo.png";

const featuredDJs = [
  {
    id: "1",
    artistName: "DJ Example 1",
    image: "/placeholder.svg",
    genres: ["House", "Techno"],
    status: "available" as const,
    upcomingEvents: 3,
  },
  {
    id: "2",
    artistName: "DJ Example 2",
    image: "/placeholder.svg",
    genres: ["Deep House", "Melodic"],
    status: "busy" as const,
    upcomingEvents: 5,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl" />
          <div className="absolute -bottom-8 -right-4 w-96 h-96 bg-accent/10 rounded-full mix-blend-multiply filter blur-xl" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-6">
              <img src={unkLogo} alt="UNK Logo" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Portal UNK
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Plataforma completa de assessoria musical para gerenciar DJs, eventos e produtores
              com tecnologia de ponta e design profissional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="glass-button">
                <Users className="w-5 h-5 mr-2" />
                Conhecer DJs
              </Button>
              <Button variant="outline" size="lg" className="glass-button">
                <Calendar className="w-5 h-5 mr-2" />
                Ver Eventos
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured DJs Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Destaques
            </h2>
            <p className="text-muted-foreground">
              Curadoria da semana em evidência no Portal UNK.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {featuredDJs.map((dj, index) => (
              <motion.div
                key={dj.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="glass-card group hover:shadow-glow transition-all duration-300 overflow-hidden">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={dj.image}
                      alt={dj.artistName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <Badge
                        variant="outline"
                        className={dj.status === 'available' ? 'status-available' : 'status-busy'}
                      >
                        {dj.status === 'available' ? 'Disponível' : 'Ocupado'}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {dj.artistName}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {dj.genres.join(" / ")}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {dj.upcomingEvents} eventos
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-primary" />
                          Featured
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="glass-button">
                        Ver detalhes
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 mx-auto mb-4 glass-card rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">12+</h3>
              <p className="text-muted-foreground">DJs Cadastrados</p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 mx-auto mb-4 glass-card rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">50+</h3>
              <p className="text-muted-foreground">Eventos Realizados</p>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 mx-auto mb-4 glass-card rounded-full flex items-center justify-center">
                <Music className="w-8 h-8 text-status-paid" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">5+</h3>
              <p className="text-muted-foreground">Produtores Ativos</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 UNK Assessoria Musical. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
